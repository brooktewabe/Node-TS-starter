import joi from 'joi';

const envVarSchema = joi
  .object({
    DB_CONNECTION: joi.string().required(),
    PORT: joi.number().positive().required(),
    NODE_ENV: joi.string(),
    JWT_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRATION_MINUTES: joi.number().positive().required(),
    AFROMESSAGE_API_TOKEN: joi.string().required(),
    DB_NAME: joi.string().required(),
    MAX_ATTEMPT_PER_DAY: joi.number().positive().required(),
  })
  .unknown();

  export const envValidation = {
    validate: (env: NodeJS.ProcessEnv) => envVarSchema.validate(env)
  };
