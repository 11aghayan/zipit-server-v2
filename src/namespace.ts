declare namespace NodeJS {
  interface ProcessEnv {
    PG_USER: string;
    PG_HOST: string;
    PG_PORT: string;
    PG_DATABASE: string;
    PG_PASSWORD: string;
    JWT_TOKEN_SECRET: string;
    ADMIN_URL: string;
    PUBLIC_URL: string;
    COOKIE_DOMAIN: string;
    NODEMAILER_PASSWORD: string;
  }
}