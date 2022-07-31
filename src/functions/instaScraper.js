/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
import imaps from 'imap-simple';
import _ from 'lodash';
import { simpleParser } from 'mailparser';
// import FileCookieStore from 'tough-cookie-filestore2'
import { IgApiClient } from 'instagram-private-api';

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const { INSTA_USER, INSTA_PASS, EMAIL, EMAIL_APP_PASS, EMAIL_IMAP } = process.env;

const ig = new IgApiClient();
ig.state.generateDevice(INSTA_USER);

const getCodeOnEmail = async () => {
  await ig.challenge.selectVerifyMethod('1');
  console.log(ig.state.checkpoint); // Challenge info here

  const emailConfig = {
    imap: {
      user: EMAIL,
      password: EMAIL_APP_PASS,
      host: EMAIL_IMAP,
      port: '993',
      tls: true,
      authTimeout: 30000,
      tlsOptions: {
        servername: 'imap.gmail.com',
        rejectUnauthorized: 'false',
      },
    },
  };

  console.log('Sleeping 40s...');
  // await sleep(40000);

  imaps.connect(emailConfig).then(async (connection) =>
    connection.openBox('INBOX').then(async () => {
      console.log('Open INBOX.');
      const delay = 1 * 3600 * 1000;
      let lastHour = new Date();
      lastHour.setTime(Date.now() - delay);
      lastHour = lastHour.toISOString();
      const searchCriteria = ['ALL', ['SINCE', lastHour]];
      const fetchOptions = {
        bodies: [''],
      };
      return connection.search(searchCriteria, fetchOptions).then((messages) => {
        messages.forEach((item) => {
          const all = _.find(item.parts, { which: '' });
          const id = item.attributes.uid;
          const idHeader = `Imap-Id: ${id}\r\n`;
          simpleParser(idHeader + all.body, async (err, mail) => {
            if (err) {
              console.log(err);
            }

            console.log({ subject: mail.subject, text: mail.text });

            const answerCodeArr = mail.text
              .split('\n')
              .filter((line) => line && /^\S+$/.test(line) && !Number.isNaN(Number(line)));

            if (mail.text.includes('Instagram')) {
              if (answerCodeArr.length > 0) {
                // Answer code must be kept as string type and not manipulated to a number type to preserve leading zeros
                const answerCode = answerCodeArr[0];
                console.log(answerCode);

                console.log(
                  `Answered Instagram security challenge with answer code: ${answerCode}`
                );

                console.log(await ig.challenge.sendSecurityCode(answerCode));
              }
            }
          });
        });
      });
    })
  );
};

// const cookieStore = new FileCookieStore('./cookies.json');

export const main = async () => {
  try {
    console.log('Initializing Scraper...');
    await ig.simulate.preLoginFlow();
    await ig.account.login(INSTA_USER, INSTA_PASS);
    process.nextTick(async () => ig.simulate.postLoginFlow());

    console.log('Finding User id...');
    const userId = await ig.user.getIdByUsername('smsindelicado');

    console.log('Getting User feed', { userId });
    const userFeed = ig.feed.user(userId);

    console.log('Scrapping Pages...');
    const pages = [];

    for (let i = 0; i < 2; i++) {
      try {
        const page = await userFeed.items();
        pages.push(page);
      } catch (error) {
        break;
      }
    }

    const feedPages = pages.flat();
    console.log('Items length', { length: feedPages.length });

    // const pageOne = await userFeed.items();
    // const pageTwo = await userFeed.items();
    // const pagethree = await userFeed.items();
    // const pageFour = await userFeed.items();
    // const pageFive = await userFeed.items();

    // const feedPages = [...pageOne, ...pageTwo, ...pagethree, ...pageFour, ...pageFive];

    // console.log('Getting media url...');
    // const mediaId = myPostsFirstPage[0].caption?.media_id;
    // const data = mediaId && (await ig.media.info(mediaId));
    // const text = data?.items?.[0]?.caption.text;
    // const imgUrl = data?.items?.[0]?.image_versions2?.candidates?.[0]?.url;
    // const videoUrl = data?.items?.[0]?.video_versions?.[0]?.url;
    // const media = videoUrl || imgUrl;
    // console.log({ text, videoUrl, imgUrl, media });
    console.log({ feedPages, lenght: feedPages.length });

    return 'Successfully scraped!';
  } catch (error) {
    console.log('First error', { error });

    if (error.status === 403) {
      console.log('Unauthorized!');
      return 'Unauthorized!';
    }

    if (error.message.includes('challenge_required')) {
      console.log('Solving challenge...');
      await getCodeOnEmail();
    }
  }

  return 'Successfully!!!!';
};
