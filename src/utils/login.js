/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable eqeqeq */
/* eslint-disable no-promise-executor-return */
import fs from 'fs';
import Bluebird from 'bluebird';
import { IgApiClient, IgCheckpointError, IgLoginRequiredError, IgLoginBadPasswordError } from 'instagram-private-api';
import _ from 'lodash';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import shortid from 'shortid';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import path from 'path'
import 'colors';

const ig = new IgApiClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const { INSTA_USER, EMAIL, EMAIL_APP_PASS, EMAIL_IMAP } = process.env;

const getCodeOnEmail = async () => {
  await ig.challenge.selectVerifyMethod('1');
  // console.log(ig.state.checkpoint); // Challenge info here

  const emailConfig = {
    imap: {
      user: EMAIL,
      password: EMAIL_APP_PASS,
      host: EMAIL_IMAP,
      port: '993',
      tls: true,
      authTimeout: 30000,
      tlsOptions: {
        servername: EMAIL_IMAP,
        rejectUnauthorized: 'false',
      },
    },
  };

  console.log('Sleeping 40s...');
  await sleep(40000);

  await imaps.connect(emailConfig).then(async (connection) =>
    connection.openBox('INBOX').then(async () => {
      console.log('Open INBOX.');
      const delay = 120;
      let lastHour = new Date();
      lastHour.setTime(Date.now() - delay);
      lastHour = lastHour.toISOString();
      const searchCriteria = ['ALL', ['SINCE', lastHour]];
      const fetchOptions = {
        bodies: [''],
      };
      return connection.search(searchCriteria, fetchOptions).then(async (messages) => {
        messages.forEach(async (item) => {
          const all = _.find(item.parts, { which: '' });
          const id = item.attributes.uid;
          const idHeader = `Imap-Id: ${id}\r\n`;
          simpleParser(idHeader + all.body, async (err, mail) => {
            if (err) {
              console.log(err);
            }

            const answerCodeArr = mail.text
              .split('\n')
              .filter((line) => line && /^\S+$/.test(line) && !Number.isNaN(Number(line)));

            if (mail.text.includes('Instagram')) {
              if (answerCodeArr.length > 0) {
                // Answer code must be kept as string type and not manipulated to a number type to preserve leading zeros
                const answerCode = answerCodeArr[0];

                console.log(
                  `Answered Instagram security challenge with answer code: ${answerCode}`
                );

                await ig.challenge.sendSecurityCode(answerCode);
                await sleep(1000);
              }
            }
          });
        });
      });
    })
  );
};


function saveCookies(cookies, state) {
  // console.log(cookies);
  // console.log(state);
  const cookiepath = path.resolve(__dirname, 'cookies', `${(process.env.IG_USERNAME).toLowerCase()}.json`);
  if (!fs.existsSync(path.resolve(__dirname, 'cookies'))) {
    fs.mkdirSync(path.resolve(__dirname, 'cookies'));
  }
  if (!fs.existsSync(path.resolve(__dirname, 'db'))) {
    fs.mkdirSync(path.resolve(__dirname, 'db'));
  }
  if (!fs.existsSync(cookiepath)) {
    // Create the file if it does not exists
    fs.closeSync(fs.openSync(cookiepath, 'w'));
  } else {
    // console.log("File exists on saveCookie function, do not create it again");
  }
  cookies.state = state;
  cookies = JSON.stringify(cookies);
  fs.writeFileSync(cookiepath, cookies);
  return {
    cookies,
    state,
  };
}
async function loadCookies() {

  const cookiepath = path.resolve(__dirname, 'cookies', `${(process.env.IG_USERNAME).toLowerCase()}.json`);
  // console.log("Trying to load filepath " + cookiepath);
  // console.log(__dirname);
  if (fs.existsSync(cookiepath)) {
    let cookies = fs.readFileSync(cookiepath).toString();
    // console.log(cookies);
    // In order to restore session cookies you need this
    await ig.state.deserializeCookieJar(cookies);
    // In order to restore state we use this
    cookies = JSON.parse(cookies);
    ig.state.deviceString = cookies.state.deviceString;
    ig.state.deviceId = cookies.state.deviceId;
    ig.state.uuid = cookies.state.uuid;
    ig.state.phoneId = cookies.state.phoneId;
    ig.state.adid = cookies.state.adid;
    ig.state.build = cookies.state.build;
    console.log("Cookies loaded".cyan);
    return true;
  }
  console.log("No cookie file found in loadCookies function");
  return false;
}


// Generate Basic directories
if (!fs.existsSync(path.resolve(__dirname, 'output'))) {
  fs.mkdirSync(path.resolve(__dirname, 'output'));
}
if (!fs.existsSync(path.resolve(__dirname, 'logins'))) {
  fs.mkdirSync(path.resolve(__dirname, 'logins'));
}

// You must generate device id's before login.
// Id's generated based on seed
// So if you pass the same value as first argument - the same id's are generated every time
ig.state.generateDevice(INSTA_USER);
ig.simulate.preLoginFlow();
// Optionally you can setup proxy url

// if Input proxy == false then we force to not use the proxy
async function login(inputLogin = null, inputPassword = null, inputProxy = null) {
  if (inputLogin != null && inputPassword != null) {
    process.env.IG_USERNAME = inputLogin;
    process.env.IG_PASSWORD = inputPassword;
    if (inputProxy != null && inputProxy != false)
      process.env.IG_PROXY = inputProxy;

  }

  if (process.env.IG_PROXY && inputProxy != false) {
    console.log("Using proxy".green);
  } else {
    console.log("Not using proxy".gray);
    console.log("Mobile/Residential proxy recommended".gray);
  }

  ig.state.proxyUrl = process.env.IG_PROXY;
  console.log("Trying to log with ".cyan + process.env.IG_USERNAME.green);
  // First we check if the user have cookies
  const hasCookies = await loadCookies();


  // Execute all requests prior to authorization in the real Android application
  // This function executes after every request
  ig.request.end$.subscribe(async () => {
    // Here you have JSON object with cookies.
    // You could stringify it and save to any persistent storage
    const cookies = await ig.state.serializeCookieJar();
    const state = {
      deviceString: ig.state.deviceString,
      deviceId: ig.state.deviceId,
      uuid: ig.state.uuid,
      phoneId: ig.state.phoneId,
      adid: ig.state.adid,
      build: ig.state.build,
    };
    saveCookies(cookies, state);
    // In order to restore session cookies you need this
    await ig.state.deserializeCookieJar(JSON.stringify(cookies));
    ig.state.deviceString = state.deviceString;
    ig.state.deviceId = state.deviceId;
    ig.state.uuid = state.uuid;
    ig.state.phoneId = state.phoneId;
    ig.state.adid = state.adid;
    ig.state.build = state.build;
  });

  await ig.simulate.preLoginFlow();
  const result = await Bluebird.try(async () => {
    if (!hasCookies) {
      console.log("User not logged in, login in");
      await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    }
    // Time to try if we can interact
    // If interaction works, we send the IG session to the result 
    // Inject user information on the interaction intent

    try {
      ig.loggedInUser = await ig.account.currentUser();
      console.log("Logged in".green);
    } catch (e) {
      console.log(e);
      console.log("Login failed from cookie | Remove incorrect cookie".red);
      return "removeCookie";
    };


    // Open DB
    const adapter = new FileSync(path.resolve(__dirname, 'db', `${(process.env.IG_USERNAME).toLowerCase()}.json`));
    const db = low(adapter);
    db.defaults({ likes: [], follows: [] }).write()
    ig.shortid = shortid;
    ig.db = db;

    return ig;
  }).catch(IgCheckpointError, async () => {
    console.log('Solving challenge...');
    await getCodeOnEmail();
    return ig;

  }).catch(IgLoginRequiredError, () => {
    if (hasCookies) {
      console.log("Invalid cookies");
    } else {
      // This block is not supossed to be used never (IgLoginBadPasswordError) exists
      console.log("Incorrect password");
      return "incorrectPassword";
    }
  }).catch(IgLoginBadPasswordError, () => {
    console.log("Incorrect password");
    return "incorrectPassword";
  });
  // If result is not undefined we send the ig object session
  return result;
}



export default login;