import yargs from 'yargs';

import authorize from './authorize';
import scan from './scan';

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
  .argv;