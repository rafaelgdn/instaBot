/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
import axios from 'axios';
import { S3 } from 'aws-sdk';
import mime from 'mime';
import { IgApiClient } from 'instagram-private-api';
import { getCodeOnEmail } from '../utils/login';
// import Login from '../utils/login';

const { INSTA_USER, INSTA_PASS } = process.env;
const bucket = 'insta-scraper-posts';
const s3 = new S3();
const ig = new IgApiClient();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// const memesGeralUsers = [
//   'smsindelicado',
//   'pqoshomensmorre',
//   'comediavids',
//   'memesbrr1',
//   'debochadaa_ofical',
//   'memes24horasoficial',
//   'memesbrasileiroos_',
//   'rindoalto',
//   'memesdolusca'
// ]

const memesFreefireUsers = [
  'freefiire_memes',
  'freefire.memes.brasiil',
  'freefire.memes_zuera',
  'freefire.memesbr2',
  'freefirememess.br',
];

const login = async () => {
  try {
    ig.state.generateDevice(INSTA_USER);
    await ig.account.login(INSTA_USER, INSTA_PASS);
  } catch (error) {
    if (JSON.stringify(error).toLowerCase().includes('challenge_required')) {
      await getCodeOnEmail({ ig });
      return;
    }

    throw error;
  }
};

export const main = async () => {
  try {
    // const ig = await Login(INSTA_USER, INSTA_PASS);

    await login();

    console.log('Finding User id...');
    const users = [];
    for (const username of memesFreefireUsers) {
      try {
        const user = await ig.user.getIdByUsername(username);
        users.push(user);
        await sleep(getRandomIntInclusive(1000, 5000));
      } catch (error) {
        continue;
      }
    }
    console.log('Getting Users feeds');
    const usersFeed = await Promise.all(users.map(async (user) => ig.feed.user(user)));

    console.log('Scrapping Pages...');
    const pages = [];

    for (let i = 0; i < 10; i++) {
      try {
        const items = [];

        for (const userFeed of usersFeed) {
          try {
            const item = await userFeed.items();
            items.push(item);
            await sleep(getRandomIntInclusive(1000, 5000));
          } catch (error) {
            continue;
          }
        }

        pages.push(items.flat());
      } catch (error) {
        continue;
      }
    }

    const feedPages = pages.flat();
    console.log('Items length', { length: feedPages.length });

    for (const page of feedPages) {
      console.log('Getting media url...');
      const mediaId = page.caption?.media_id;
      const info = mediaId && (await ig.media.info(mediaId));
      const text = info?.items?.[0]?.caption.text;
      const imgUrl = info?.items?.[0]?.image_versions2?.candidates?.[0]?.url;
      const videoUrl = info?.items?.[0]?.video_versions?.[0]?.url;
      const media = videoUrl || imgUrl;

      if (!media) continue;

      if (imgUrl && videoUrl) {
        const imgResp = await axios.get(imgUrl, { responseType: 'stream' });
        const contentType = imgResp.headers['content-type'];
        const imgExt = mime.getExtension(contentType);

        await s3
          .upload({
            Bucket: bucket,
            ACL: 'private',
            Key: `memes/freefire/${mediaId}/${mediaId}-cover.${imgExt}`,
            Body: imgResp.data,
          })
          .promise();
      }

      const resp = await axios.get(media, { responseType: 'stream' });
      const contentType = resp.headers['content-type'];
      const ext = mime.getExtension(contentType);

      await s3
        .upload({
          Bucket: bucket,
          ACL: 'private',
          Key: `memes/freefire/${mediaId}/${mediaId}.${ext}`,
          Body: resp.data,
        })
        .promise();

      await s3
        .upload({
          Bucket: bucket,
          ACL: 'private',
          Key: `memes/freefire/${mediaId}/text.txt`,
          Body: text,
        })
        .promise();

      await sleep(getRandomIntInclusive(3000, 10000));
    }

    return 'Successfully scraped!';
  } catch (error) {
    console.log('First error', { error });
    throw error;
  }
};
