# Google Drive Utilities

This repository provides some utilities for interacting with your Google Drive.

## Available Tools

### Scan

Recently, I got an e-mail from Google Drive telling me that I was sharing files that it had identified as malware. I had numerous shared folders, including one containing over 10,000 files organized into several levels of subfolders, and Google gives you no mechanism to scan your Drive or list out the files it's flagged as malware. So I was left in the dark about what I was sharing that was problematic, and couldn't fix the problem.

Thus, I built this scanning tool, which uses the Drive API to check every file in your Drive to see whether Google has identified it as abusive. It does this by taking advantage of the fact that using `files.get` to download an abusive file [will fail unless you pass an `acknowledgeAbuse` parameter](https://developers.google.com/drive/api/v3/reference/files/get).

### Xcopy

A simple operation that makes a copy of an entire folder structure.
## Setup

### Create Google Drive API project

See [Google's documentation](https://developers.google.com/drive/api/v3/quickstart/nodejs) about how to do this. Download and save the `credentials.json` file for your project.

### Set up repository

1. Clone the repo.
2. Place the `credentials.json` for your API project in the `./credentials` credentials directory.
3. Run `yarn`.
4. Set the following environment variables:
    ```sh
    CREDENTIALS_PATH=./credentials/credentials.json
    TOKEN_PATH=./credentials/token.json
    ```

### Authorize your application

Run `yarn cli authorize`. You'll be given a URL to visit, where you'll be prompted to grant your application access to your Drive. You'll need to click the Advanced link to see the option to continue.

<img 
  src=content/drive-auth-screenshot.png 
  alt="Authorization screenshot"
  width=360>

After authorizing everything, you'll be given a code to paste in the command-line.

```sh
$ yarn cli authorize
Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/v2/auth?...
Enter the code from that page here: ...
Access token created.
{
  access_token: '...',
  refresh_token: '...',
  scope: 'https://www.googleapis.com/auth/drive',
  token_type: 'Bearer',
  expiry_date: ...
}
Token stored to ./credentials/token.json
✨  Done in 36.95s.
```

This will save your token into the location specified for `TOKEN_PATH`.

## Usage

For complete usage, run `yarn cli --help`.

#### `yarn cli authorize`

* If you need to recreate your `token.json` file (because you want to connect to a different Drive, or because the refresh token has expired), run `yarn authorize --reauthorize`.

#### `yarn cli scan`

* This command will scan all files that you have access to, including files you do not own, and even if they are in Shared With Me or Recent Files and not in your actual Drive.
* The scan will skip files larger then `MAX_SCANNABLE_SIZE` (currently set to 100M), because the `files.get` call can take quite some time for large files, and AFAICT they don't get malware-scanned by Drive anyway.

#### `yarn cli xcopy`

* The copied files will be owned by you, even if the originals are not.