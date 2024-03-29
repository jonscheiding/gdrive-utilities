import yargs from 'yargs';

import authorize from './commands/authorize';
import copy from './commands/copy';
import scan from './commands/scan';
import test from './commands/test';

yargs
  .strict()
  .demandCommand()
  .command('authorize', 'Initiates authorization for Google API.',
    y => y
      .option('reauthorize', {
        type: 'boolean',
        alias: 'r',
        description: 'Indicates that the token should be re-generated.'
      }),
    authorize
  )
  .command('scan', 'Scans entire connected Google Drive for malware.',
    y => y
      .option('output', {
        type: 'string',
        alias: 'o',
        description: 'A path where the command should output a JSON file containing detailed results.'
      }),
    scan
  )
  .command('xcopy <sourceFolderId>', 'Recursively makes a copy of a folder.',
    y => y
      .positional('sourceFolderId', {
        type: 'string',
        description: 'The ID of the folder to copy.',
      })
      .option('targetParentFolderId', {
        type: 'string',
        alias: 't',
        description: 'The ID of the folder to copy to.'
      })
      .option('copiedFolderName', {
        type: 'string',
        alias: 'n',
        description: 'The name to give the copy.'
      })
      .option('output', {
        type: 'string',
        alias: 'o',
        description: 'A path where the command should output a JSON file containing detailed results.'
      }),
    copy
  )
  .command('test', 'Validates access by listing files in the root of the Drive.',
    () => {},
    test
  )
  .argv;