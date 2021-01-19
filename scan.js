import fs from 'fs';
import util from 'util';
import { google } from 'googleapis';
import { RateLimiter } from 'limiter';

import { getEnv } from './getEnv';

const env = getEnv();

/**
 * @typedef Error
 * @property reason {String}
 * @property message {String}
 * @property domain {String}
 */

/**
 * @typedef ErroredFile
 * @property file {import('googleapis').drive_v3.Schema$File}
 * @property errors {Error[]}
 */

/**
 * @typedef Progress {object}
 * @property discovered {Number}
 * @property checked {Number}
 * @property skipped {Number}
 * @property pages {Number}
 * @property errored {ErroredFile[]}
 */

/**
 * @callback ProgressCallback
 * @param {Progress} progress
 */

function getDrive() {
  const credentials = JSON.parse(fs.readFileSync(env.CREDENTIALS_PATH));
  const token = JSON.parse(fs.readFileSync(env.TOKEN_PATH));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(token);
  return google.drive({version: 'v3', auth: oAuth2Client});
}

/**
 * @param {ProgressCallback} onProgress
 * @returns {Progress}
 */
async function scanInternal(onProgress) {
  const drive = getDrive();
  
  /** @type Progress */
  const progress = {
    discovered: 0,
    checked: 0,
    skipped: 0,
    pages: 0,
    errored: [],
    abort: false
  };

  const q = `
    (
      not mimeType contains "application/vnd.google-apps"
    )
    and
    trashed = false
  `;

  const limiter = new RateLimiter(1, 100);
  const removeTokens = util.promisify(limiter.removeTokens.bind(limiter));

  let pageToken = null;

  do {
    await removeTokens(1);
    const page = await drive.files.list({
      pageSize: 10,
      q: q,
      fields: 'files/id, files/name, files/size, files/webViewLink',
      pageToken: pageToken
    });

    progress.discovered += page.data.files.length;
    progress.pages++;

    const promises = [];

    for(const file of page.data.files) {
      if(file.size >= 25000000) {
        progress.skipped++;
        continue;
      }

      promises.push(
        removeTokens(1)
          .then(() => drive.files.get({ fileId: file.id, alt: 'media' }))
          .catch(e => progress.errored.push({file, errors: e.errors}))
          .then(() => {
            progress.checked++;
            onProgress(progress);
          })
      );
    }

    await Promise.all(promises);
  } while(pageToken != null && !progress.abort);

  return progress;
}

async function scan() {
  /** @type ProgressCallback */
  const onProgress = (progress) => {
    if(progress.pages > 3) progress.abort = true;
  };

  const results = await scanInternal(onProgress);

  console.log(`${results.checked} files checked, ${results.skipped} skipped.`);
  console.log(results.errored.map(r => 
    `${r.file.name}: ${r.errors.map(e => e.reason).join(', ')} ${r.file.webViewLink}`
  ));
}

scan().catch(console.error);
