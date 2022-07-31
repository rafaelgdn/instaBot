/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
import Login from '../utils/login';



const { INSTA_USER, INSTA_PASS } = process.env;

// const ig = new IgApiClient();
// ig.state.generateDevice(INSTA_USER);



// const cookieStore = new FileCookieStore('./cookies.json');

export const main = async () => {
  try {
    const loggin = await Login(INSTA_USER, INSTA_PASS);
    console.log({ loggin })
    // console.log('Initializing Scraper...');
    // await ig.simulate.preLoginFlow();
    // await ig.account.login(INSTA_USER, INSTA_PASS);
    // process.nextTick(async () => ig.simulate.postLoginFlow());
  } catch (error) {
    console.log('First error', { error });
    throw error;
  }

  // console.log('Finding User id...');
  // const userId = await ig.user.getIdByUsername('smsindelicado');

  // console.log('Getting User feed', { userId });
  // const userFeed = ig.feed.user(userId);

  // console.log('Scrapping Pages...');
  // const pages = [];

  // for (let i = 0; i < 2; i++) {
  //   try {
  //     const page = await userFeed.items();
  //     pages.push(page);
  //   } catch (error) {
  //     break;
  //   }
  // }

  // const feedPages = pages.flat();
  // console.log('Items length', { length: feedPages.length });

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
  // console.log({ feedPages, lenght: feedPages.length });

  return 'Successfully scraped!';
};
