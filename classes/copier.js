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
 * @property copied {Number}
 * @property copying {Number}
 * @property errored {ErroredFile[]}
 */

/**
 * @callback ProgressCallback
 * @param {Progress} progress
 * @param {String} descriptor
 */

/**
 * @callback FileCopyCallback
 */

export default class Copier {
  /**
   * @param {import('googleapis').drive_v3.Drive} drive
   * @param {number} maxScannableSize
   */
  constructor(drive) {
    this.drive = drive;
    this.limiter = new RateLimiter(1, 200);

    this.removeTokens = util.promisify(
      this.limiter.removeTokens.bind(this.limiter));
  }

  /**
   * @param {import('googleapis').drive_v3.Schema$File} file 
   * @param {import('googleapis').drive_v3.Schema$File} targetFolder
   * @param {Progress} progress 
   * @param {ProgressCallback} onProgress 
   */
  async copyFile(file, targetFolder, progress, onProgress) {
    progress.copying++;
    onProgress(progress, file.name);
    
    
    try {
      if(file.mimeType === 'application/vnd.google-apps.folder') {
        await this.removeTokens(1);
        const result = await this.drive.files.create({
          requestBody: {
            name: file.name,
            mimeType: file.mimeType,
            parents: [targetFolder.id]
          }
        });

        await this.copyFolder(file, result.data, progress, onProgress);
      } else {
        await this.removeTokens(1);
        await this.drive.files.copy({fileId: file.id, requestBody: {
          name: file.name,
          parents: [targetFolder.id]
        }});
      }
    } catch(e) {
      console.error(e);
      progress.errored.push({file, errors: e.errors});
    }
  
    progress.copying--;
    progress.copied++;
    onProgress(progress, file.name);
    return progress;
  }
  
  /**
   * @param {import('googleapis').drive_v3.Schema$File} sourceFolder
   * @param {import('googleapis').drive_v3.Schema$File} targetFolder
   * @param {Progress} progress 
   * @param {ProgressCallback} onProgress
   */
  async copyFolder(sourceFolder, targetFolder, progress, onProgress) {
    const q = `'${sourceFolder.id}' in parents and trashed = false`;
    const promises = [];
    let pageToken = null;

    do {
      await this.removeTokens(1);
      const page = await this.drive.files.list({
        pageSize: 100,
        q: q,
        fields: 'files(id, name, mimeType), nextPageToken',
        pageToken: pageToken
      });

      progress.discovered += page.data.files.length;

      onProgress(progress);
  
      for(const file of page.data.files) {
        promises.push(this.copyFile(file, targetFolder, progress, onProgress));
      }
  
      pageToken = page.data.nextPageToken;
    } while(pageToken != null);

    await Promise.all(promises);
    onProgress(progress);
    return progress;
  }

  /**
   * 
   * @param {string} sourceFolderName 
   * @param {string} targetFolderName 
   * @param {ProgressCallback} onProgress 
   * @returns 
   */
  async copyTopLevelFolder(folderId, targetFolderName, onProgress) {
    const progress = {
      discovered: 0, copied: 0, copying: 0, pages: 0,
      errored: []
    };

    await this.removeTokens(1);
    const sourceFolderResponse = await this.drive.files.get({fileId: folderId});

    const sourceFolder = sourceFolderResponse.data;

    if(!targetFolderName) {
      targetFolderName = `${sourceFolder.name} Copy ${new Date().getTime()}`;
    }

    await this.removeTokens(1);
    const targetFolderResponse = await this.drive.files.create({
      requestBody: {
        name: targetFolderName,
        mimeType: 'application/vnd.google-apps.folder'
      }
    });

    await this.copyFolder(sourceFolder, targetFolderResponse.data, progress, onProgress);

    return progress;
  }
}
