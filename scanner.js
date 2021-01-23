import util from 'util';
import { RateLimiter } from 'limiter';

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
 * @typedef Progress {Object}
 * @property discovered {Number}
 * @property checked {Number}
 * @property skipped {Number}
 * @property processing {Number}
 * @property pages {Number}
 * @property errored {ErroredFile[]}
 */

/**
 * @callback ProgressCallback
 * @param {Progress} progress
 * @param {String} descriptor
 */

/**
 * @callback FileScanCallback
 */

export class Scanner {
  /**
   * @param {import('googleapis').drive_v3.Drive} drive
   * @param {number} maxScannableSize
   */
  constructor(drive, maxScannableSize) {
    this.drive = drive;
    this.maxScannableSize = maxScannableSize;
    this.limiter = new RateLimiter(1, 200);

    this.removeTokens = util.promisify(
      this.limiter.removeTokens.bind(this.limiter));
  }

  /**
   * @param {import('googleapis').drive_v3.Schema$File} file 
   * @param {Progress} progress 
   * @param {ProgressCallback} onProgress 
   */
  async scanFile(file, progress, onProgress) {
    progress.processing++;
    onProgress(progress, file.name);

    await this.removeTokens(1);
  
    try {
      await this.drive.files.get({ fileId: file.id, alt: 'media' });
    } catch(e) {
      progress.errored.push({file, errors: e.errors});
    }
  
    progress.processing--;
    progress.checked++;
    onProgress(progress, file.name);
  }

  /**
   * @param {ProgressCallback} onProgress
   */
  async scanDrive(onProgress) {
    /** @type Progress */
    const progress = {
      discovered: 0, checked: 0, skipped: 0, processing: 0, pages: 0,
      errored: [], abusive: []
    };

    const q = `
      not mimeType contains "application/vnd.google-apps"
      and
      trashed = false
    `;

    let pageToken = null;

    const promises = [];

    do {
      const page = await this.drive.files.list({
        pageSize: 100,
        q: q,
        fields: 'files(id, name, size, webViewLink, parents), nextPageToken',
        pageToken: pageToken
      });

      progress.discovered += page.data.files.length;
      progress.pages++;

      onProgress(progress, `Page ${progress.pages}`);
  
      for(const file of page.data.files) {
        if(file.size >= this.maxScannableSize) {
          progress.skipped++;
          continue;
        }
  
        promises.push(this.scanFile(file, progress, onProgress));
      }
  
      pageToken = page.data.nextPageToken;
    } while(pageToken != null);

    await Promise.all(promises);
    onProgress(progress, 'Finished');
    return progress;
  }
}