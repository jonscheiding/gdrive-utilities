import fs from 'fs';
import Jetty from 'jetty';

import Copier from '../classes/copier';
import getDrive from '../getDrive';

/**
 * @typedef Args {Object}
 * @property folderId {String}
 * @property copiedFolderName {String}
 * @property output {String}
 */

/**
 * @param {Args} args 
 */
export default async function copy(args) {
  const jetty = new Jetty(process.stdout);

  /** @type ProgressCallback */
  const onProgress = (progress, descriptor) => {
    jetty.clear();
    jetty.moveTo(0, 0);
    jetty.text(`Discovered: ${progress.discovered} (${progress.pages} pages)\n`);
    jetty.text(`Copying: ${progress.copying}\n`);
    jetty.text(`Copied: ${progress.copied}\n`);
    
    jetty.text('\n' + descriptor + '\n');
    
    jetty.text(`\nIssues: ${progress.errored.length}\n`);
    for(const r of progress.errored) {
      jetty.text(`${r.file.name}: ${r.errors.map(e => e.message).join(', ')}\n`);
    }
  };

  const copier = new Copier(getDrive());
  const results = await copier.copyTopLevelFolder(args.folderId, args.copiedFolderName, onProgress);
  console.log(results);

  if(args.output) {
    fs.writeFileSync(args.output, JSON.stringify(results, null, '  '));
    console.log(`Detailed results saved to ${args.output}.`);
  }
}
