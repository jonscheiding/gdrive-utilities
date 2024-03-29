import fs from 'fs';

import { progressCallback } from '../progress';
import getDrive from '../getDrive';
import Copier from '../classes/copier';

/**
 * @typedef Args {Object}
 * @property sourceFolderId {String}
 * @property copiedFolderName {String}
 * @property output {String}
 */

/**
 * @param {Args} args 
 */
export default async function copy(args) {
  const copier = new Copier(getDrive());
  const results = await copier.copyTopLevelFolder(
    args.sourceFolderId, 
    args.targetParentFolderId,
    args.copiedFolderName, 
    progressCallback(process.stdout));

  console.log(results);

  if(args.output) {
    fs.writeFileSync(args.output, JSON.stringify(results, null, '  '));
    console.log(`Detailed results saved to ${args.output}.`);
  }
}
