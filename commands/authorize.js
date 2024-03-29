// Copied from https://developers.google.com/drive/api/v3/quickstart/nodejs

import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';

import getEnv from '../getEnv';

/**
 * @typedef Args {Object}
 * @property reauthorize {Boolean}
 */

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// The credentials file stores the application's client ID and client secret,
// used for generating the token requests.
// The token file stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const { CREDENTIALS_PATH, TOKEN_PATH } = getEnv();

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {boolean} reauthorize
 */
function getClient(credentials, callback, reauthorize) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err || reauthorize) return getAccessToken(oAuth2Client, callback);
    console.log(`Token file ${TOKEN_PATH} already exists.`);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * @param {Args} args 
 */
export default function authorize(args) {
// Load client secrets from a local file.
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    getClient(JSON.parse(content), auth => {
      console.log('Access token created.');
      console.log(auth.credentials);
    },
    args.reauthorize);
  });
}
