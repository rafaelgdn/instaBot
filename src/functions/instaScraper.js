/* eslint-disable camelcase */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
import imaps from 'imap-simple';
import _ from 'lodash';
import { simpleParser } from 'mailparser';
// import FileCookieStore from 'tough-cookie-filestore2'
import { IgApiClient } from 'instagram-private-api';
// import inquirer from 'inquirer';

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ig = new IgApiClient();
ig.state.generateDevice('espacosinvisiveisblog@gmail.com');

const getCodeOnEmail = async () => {
  await ig.challenge.selectVerifyMethod('1');
  console.log(ig.state.checkpoint); // Challenge info here
  // const { code } = await inquirer.prompt([
  //   {
  //     type: 'input',
  //     name: 'code',
  //     message: 'Enter code',
  //   }
  // ]);


  const emailConfig = {
    imap: {
      user: 'espacosinvisiveisblog@gmail.com',
      password: 'ghfduewsybkduixi',
      host: 'imap.gmail.com',
      port: '993',
      tls: true,
      authTimeout: 30000,
      tlsOptions: {
        servername: 'imap.gmail.com',
        rejectUnauthorized: 'false'
      }
    }
  }

  console.log('Sleeping 40s...')
  // await sleep(40000);

  imaps.connect(emailConfig).then(async (connection) => connection.openBox('INBOX').then(async () => {
    console.log('Open INBOX.')
    const delay = 1 * 3600 * 1000;
    let lastHour = new Date();
    lastHour.setTime(Date.now() - delay);
    lastHour = lastHour.toISOString();
    const searchCriteria = ['ALL', ["SINCE", lastHour]];
    const fetchOptions = {
      bodies: [''],
    };
    return connection
      .search(searchCriteria, fetchOptions)
      .then(messages => {
        messages.forEach((item) => {
          const all = _.find(item.parts, { which: "" });
          const id = item.attributes.uid;
          const idHeader = `Imap-Id: ${id}\r\n`;
          simpleParser(idHeader + all.body, async (err, mail) => {
            if (err) {
              console.log(err);
            }

            console.log({ subject: mail.subject, text: mail.text });

            const answerCodeArr = mail.text
              .split("\n")
              .filter(
                (line) =>
                  line && /^\S+$/.test(line) && !Number.isNaN(Number(line))
              );

            if (mail.text.includes("Instagram")) {
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
  }));
}

// const cookieStore = new FileCookieStore('./cookies.json');



export const main = async () => {
  try {
    console.log('Initializing Scraper...')
    await ig.simulate.preLoginFlow();
    await ig.account.login('espacosinvisiveisblog@gmail.com', 'Rafa2404#espacosinvisiveis');
    process.nextTick(async () => ig.simulate.postLoginFlow());

    const userId = await ig.user.getIdByUsername('smsindelicado')
    const userFeed = ig.feed.user(userId);
    const myPostsFirstPage = await userFeed.items();

    myPostsFirstPage.forEach(({ caption }) => {
      console.log({ caption })
    })

  } catch (error) {
    console.log('First error', { error })

    if (error.status === 403) {
      console.log('Unauthorized!');
      return 'Unauthorized!';
    }

    if (error.message.includes('challenge_required')) {
      console.log('Solving challenge...');
      await getCodeOnEmail();
    }
  }

  return 'Successfully!!!!'
}