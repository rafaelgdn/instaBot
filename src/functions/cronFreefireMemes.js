/* eslint-disable no-console */
import { S3 } from 'aws-sdk';
import { IgApiClient } from 'instagram-private-api';
import fs from 'fs';

const s3 = new S3();
const ig = new IgApiClient();
const bucket = 'insta-scraper-posts';
const { INSTA_USER, INSTA_PASS } = process.env;

// const { latitude, longitude, searchQuery } = {
//   latitude: -25.441105,
//   longitude: -49.276855,
//   // not required
//   searchQuery: 'place',
// };

ig.state.generateDevice(INSTA_USER);

export const main = async () => {
  try {
    await ig.account.login(INSTA_USER, INSTA_PASS);

    const { Contents } = await s3.listObjectsV2({ Bucket: bucket, MaxKeys: 2, Prefix: 'memes/geral' }).promise();

    const files = await Promise.all(Contents.map(async ({ Key }) => {
      const file = await s3.getObject({
        Bucket: bucket,
        Key,
      }).promise();

      return file.Body;
    }));

    // const locations = await ig.search.location(latitude, longitude, searchQuery);
    // const mediaLocation = locations[0];


    const publishResult = await ig.publish.video({
      video: files[0],
      coverImage: await fs.readFileAsync("../../src/assets/cover.png"),
      // location: mediaLocation,
      // caption: files[1]
    });

    console.dir({ publishResult }, { depth: null })
  } catch (error) {
    console.error(error);
    throw error;
  }

}