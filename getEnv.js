import envalid from 'envalid';

export function getEnv() {
  return envalid.cleanEnv(process.env, {
    CREDENTIALS_PATH: envalid.str(),
    TOKEN_PATH: envalid.str(),
    OUTPUT_PATH: envalid.str({default: undefined}),
    MAX_SCANNABLE_SIZE: envalid.num()
  });
}
