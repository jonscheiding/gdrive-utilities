import envalid from 'envalid';

export default function getEnv() {
  return envalid.cleanEnv(process.env, {
    CREDENTIALS_PATH: envalid.str(),
    TOKEN_PATH: envalid.str(),
    OUTPUT_PATH: envalid.str({default: undefined})
  });
}
