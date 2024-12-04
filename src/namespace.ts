declare namespace NodeJS {
  interface ProcessEnv {
    PG_USER: string;
    PG_HOST: string;
    PG_PORT: string;
    PG_DATABASE: string;
    PG_PASSWORD: string;
  }
}