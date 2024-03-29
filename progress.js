import Jetty from 'jetty';

/**
 * @typedef Error {Object}
 * @property reason {String}
 * @property message {String}
 * @property domain {String}
 */

/**
 * @typedef ErroredFile {Object}
 * @property file {import('googleapis').drive_v3.Schema$File}
 * @property exception {Object}
 * @property errors {Error[]}
 */

export class Progress {
  constructor() {
    this.discovered = 0;
    this.completed = 0;
    this.skipped = 0;
    this.processing = 0;
    this.pages = 0;
    /** @type ErroredFile[] */
    this.errored = [];
  }
}

/** 
 * @param {NodeJS.WriteStream} out
 * @returns ProgressCallback 
 */
export function progressCallback(out) {
  const jetty = new Jetty(out);
  return (progress, descriptor) => {
    jetty.clear();
    jetty.moveTo(0, 0);
    jetty.text(`Discovered: ${progress.discovered} (${progress.pages} pages)\n`);
    jetty.text(`Processing: ${progress.processing}\n`);
    jetty.text(`Skipped: ${progress.skipped}\n`);
    jetty.text(`Completed: ${progress.completed}\n`);
   
    jetty.text(`\n${descriptor || ''}\n`);
   
    jetty.text(`\nIssues: ${progress.errored.length}\n`);
    for(const r of progress.errored) {
      let message = r.exception.toString();
      if(r.errors) {
        message = r.errors.map(e => e.reason).join(', ');
      }
      jetty.text(`${r.file.name}: ${message} ${r.file.webViewLink || ''}\n`);
    }
  };
}
