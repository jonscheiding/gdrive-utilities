import { Progress } from '../progress';

export default class Copier {
  /**
   * @param {import('googleapis').drive_v3.Drive} drive
   * @param {number} maxScannableSize
   */
  constructor(drive) {
    this.drive = drive;
  }

  /**
   * @param {import('googleapis').drive_v3.Schema$File} file 
   * @param {import('googleapis').drive_v3.Schema$File} targetFolder
   * @param {Progress} progress 
   * @param {ProgressCallback} onProgress 
   */
  async copyFile(file, targetFolder, progress, onProgress) {
    progress.processing++;
    onProgress(progress, file.name);
    
    try {
      if(file.mimeType === 'application/vnd.google-apps.folder') {
        const result = await this.drive.files.create({
          supportsAllDrives: true,
          requestBody: {
            name: file.name,
            mimeType: file.mimeType,
            parents: [targetFolder.id]
          }
        });

        await this.copyFolder(file, result.data, progress, onProgress);
      } else {
        await this.drive.files.copy(          {
          fileId: file.id, 
          supportsAllDrives: true,
          requestBody: {
            name: file.name,
            parents: [targetFolder.id]
          }
        });
      }
    } catch(e) {
      progress.errored.push({file, exception: e, errors: e.errors});
    }
  
    progress.processing--;
    progress.completed++;
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
      progress.pages++;
      const page = await this.drive.files.list({
        pageSize: 100,
        q: q,
        fields: 'files(id, name, mimeType), nextPageToken',
        pageToken: pageToken
      });

      progress.discovered += page.data.files.length;

      onProgress(progress, `Page ${progress.pages}`);
  
      for(const file of page.data.files) {
        promises.push(this.copyFile(file, targetFolder, progress, onProgress));
      }
  
      pageToken = page.data.nextPageToken;
    } while(pageToken != null);

    await Promise.all(promises);
    onProgress(progress, `Copied folder ${sourceFolder.name}.`);
    return progress;
  }

  /**
   * 
   * @param {string} sourceFolderName 
   * @param {string} targetFolderName 
   * @param {ProgressCallback} onProgress 
   * @returns 
   */
  async copyTopLevelFolder(folderId, targetParentFolderId, targetFolderName, onProgress) {
    const progress = new Progress();

    const sourceFolderResponse = await this.drive.files.get({fileId: folderId});

    const sourceFolder = sourceFolderResponse.data;
    let parents = null;

    if(targetParentFolderId) {
      parents = [targetParentFolderId];
    }

    if(!targetFolderName) {
      targetFolderName = `${sourceFolder.name} Copy ${new Date().getTime()}`;
    }

    const targetFolderResponse = await this.drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        parents,
        name: targetFolderName,
        mimeType: 'application/vnd.google-apps.folder'
      }
    });

    await this.copyFolder(sourceFolder, targetFolderResponse.data, progress, onProgress);

    return progress;
  }
}
