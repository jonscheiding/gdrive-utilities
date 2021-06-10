import fs from 'fs';
import { google } from 'googleapis';
import Jetty from 'jetty';

import { getEnv } from './getEnv';
import { Scanner } from './scanner';

const env = getEnv();

/**
 * @typedef args
 * @property output {String}
 */

// Max size that Google Drive will scan for viruses
// (Currently seems to be 100M)
const MAX_SCANNABLE_SIZE = 100000000;

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
 * @param {Args} args 
 */
export default async function scan(args) {
  const jetty = new Jetty(process.stdout);

  /** @type ProgressCallback */
  const onProgress = (progress, descriptor) => {
    jetty.clear();
    jetty.moveTo(0, 0);
    jetty.text(`Discovered: ${progress.discovered} (${progress.pages} pages)\n`);
    jetty.text(`Processing: ${progress.processing}\n`);
    jetty.text(`Skipped: ${progress.skipped}\n`);
    jetty.text(`Checked: ${progress.checked}\n`);
    
    jetty.text('\n' + descriptor + '\n');
    
    jetty.text(`\nIssues: ${progress.errored.length}\n`);
    for(const r of progress.errored) {
      jetty.text(`${r.file.name}: ${r.errors.map(e => e.reason).join(', ')} ${r.file.webViewLink}\n`);
    }
  };

  const scanner = new Scanner(getDrive(), MAX_SCANNABLE_SIZE);

  const results = await scanner.scanDrive(onProgress);

  if(args.output) {
    fs.writeFileSync(args.output, JSON.stringify(results, null, '  '));
    console.log(`Detailed results saved to ${args.output}.`);
  }
}
