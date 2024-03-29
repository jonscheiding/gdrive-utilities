import fs from 'fs';

import { progressCallback } from '../progress';
import getDrive from '../getDrive';
import Scanner from '../classes/scanner';

/**
 * @typedef Args {Object}
 * @property output {String}
 */

// Max size that Google Drive will scan for viruses
// (Currently seems to be 100M)
const MAX_SCANNABLE_SIZE = 100000000;

/**
 * @param {Args} args 
 */
export default async function scan(args) {
  const scanner = new Scanner(getDrive(), MAX_SCANNABLE_SIZE);

  const results = await scanner.scanDrive(progressCallback(process.stdout));

  if(args.output) {
    fs.writeFileSync(args.output, JSON.stringify(results, null, '  '));
    console.log(`Detailed results saved to ${args.output}.`);
  }
}
