import fs from 'fs';
import util from 'util';
import { google } from 'googleapis';
import { RateLimiter } from 'limiter';

import getEnv from './getEnv';

const { CREDENTIALS_PATH, TOKEN_PATH } = getEnv();

const limiter = new RateLimiter(1, 200);
const removeTokens = util.promisify(
  limiter.removeTokens.bind(limiter));

function wrapApiCall(target, methodName) {
  const method = target[methodName];
  target[methodName] = async function() {
    await removeTokens(1);
    return method.apply(target, arguments);
  };
}

export default function getDrive() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(token);
  const drive = google.drive({version: 'v3', auth: oAuth2Client});
  for(let method of ['get', 'list', 'copy', 'create', 'update', 'export']) {
    wrapApiCall(drive.files, method);
  }
  return drive;
}