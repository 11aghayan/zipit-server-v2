declare namespace NodeJS {
  interface ProcessEnv {
    PG_USER: string;
    PG_HOST: string;
    PG_PORT: string;
    PG_DATABASE: string;
    PG_DATABASE_TEST: string;
    PG_PASSWORD: string;
    JWT_TOKEN_SECRET: string;
    ADMIN_URL_LIST: string;
    PUBLIC_URL_LIST: string;
    COOKIE_DOMAIN: string;
    MAILJET_API_KEY: string;
    MAILJET_SECRET_KEY: string;
    TO_EMAIL: string;
  }
}