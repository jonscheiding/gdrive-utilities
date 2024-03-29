import getDrive from '../getDrive';

export default async function test() {
  const drive = getDrive();

  const results = await drive.files.list({q: '"root" in parents and trashed = false'});

  console.log(`${results.data.files.length} files found in root of Drive.`);
  for(const result of results.data.files) {
    console.log(result.name);
  }
}
