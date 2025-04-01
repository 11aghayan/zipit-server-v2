import dotenv from "dotenv";
dotenv.config({
  path: ".env.test"
});
import type {Config} from 'jest';

const config: Config = {
  clearMocks: true,
  coverageProvider: "v8",
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: []
};

export default config;