/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  // PRODUCTS_MS_HOST: string;
  // PRODUCTS_MS_PORT: number;
  NATS_SERVERS: string[];
}

const envSchema = joi
  .object({
    PORT: joi.number().required(),
    // PRODUCTS_MS_HOST: joi.string().required(),
    // PRODUCTS_MS_PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value as EnvVars;

export const envs = {
  port: envVars.PORT,
  NATS_SERVERS: envVars.NATS_SERVERS,
  // PRODUCTS_MS_HOST: envVars.PRODUCTS_MS_HOST,
  // PRODUCTS_MS_PORT: envVars.PRODUCTS_MS_PORT,
};
