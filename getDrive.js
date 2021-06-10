import fs from 'fs';
import { google } from 'googleapis';

import getEnv from './getEnv';

const { CREDENTIALS_PATH, TOKEN_PATH } = getEnv();

export default function getDrive() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(token);
  return google.drive({version: 'v3', auth: oAuth2Client});
}