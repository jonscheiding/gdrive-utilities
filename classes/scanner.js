import { Progress } from '../progress';

export default class Scanner {
  /**
   * @param {import('googleapis').drive_v3.Drive} drive
   * @param {number} maxScannableSize
   */
  constructor(drive, maxScannableSize) {
    this.drive = drive;
    this.maxScannableSize = maxScannableSize;
  }

  /**
   * @param {import('googleapis').drive_v3.Schema$File} file 
   * @param {Progress} progress 
   * @param {ProgressCallback} onProgress 
   */
  async scanFile(file, progress, onProgress) {
    progress.processing++;
    onProgress(progress, file.name);

    try {
      await this.drive.files.get({ fileId: file.id, alt: 'media' });
    } catch(e) {
      progress.errored.push({file, exception: e, errors: e.errors});
    }
  
    progress.processing--;
    progress.completed++;
    onProgress(progress, file.name);
  }

  /**
   * @param {ProgressCallback} onProgress
   */
  async scanDrive(onProgress) {
    const progress = new Progress();

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
