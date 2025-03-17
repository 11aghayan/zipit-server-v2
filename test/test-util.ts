import { Response } from "supertest";

export function jwt_in_cookies(res: Response) {
  return (res.headers["set-cookie"] as unknown as string[])?.some(cookie => {
    const [key, value] = cookie.split("=");
    return key === "jwt_token" && value.length > 150;
  }) ?? false;
}

export function get_jwt_token(res: Response) {
  return (res.headers["set-cookie"] as unknown as string[])?.reduce((prev, cookie) => {
    const [key, value] = cookie.split("=");
    if (key === "jwt_token") {
      return value;
    }
    return prev;
  }, "");
}