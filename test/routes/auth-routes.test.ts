// Credentials { username: 'test_username', password: 'test_password' } -- hash - $2b$10$6fRtIcAwPEx.kMRLvGOgZ.O8H7ejDWhDPjKXvbYsaEZCiZzC/fcCK

import db from "../../src/db/auth-methods";
import request from "supertest";
import { app, BASE_URL } from "../../src";
import { get_jwt_token, jwt_in_cookies } from "../test-util";

const HASH = "$2b$10$6fRtIcAwPEx.kMRLvGOgZ.O8H7ejDWhDPjKXvbYsaEZCiZzC/fcCK";

beforeEach(async () => await db.populate_user_tbl());
afterEach(async () => await db.clear_user_tbl());

describe("Login tests", () => {
  test("login with correct credentials", async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: "test_password" });
    expect(jwt_in_cookies(res)).toBe(true);
    expect(res.status).toBe(200);
  });
  test("login with wrong password", async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: "wrong_password" });
    expect(jwt_in_cookies(res)).toBe(false);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Սխալ օգտվողի անուն կամ գաղտնաբառ" });
  });
  test("login with no password", async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: "" });
    expect(jwt_in_cookies(res)).toBe(false);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "password-ը բացակայում է" });
  });
  test("login with password type number", async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: 3 });
    expect(jwt_in_cookies(res)).toBe(false);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "typeof password is number" });
  });
});

describe("Logout tests", () => {
  test("logout with jwt token in cookies", async () => {
    const res = await request(app)
      .get(`${BASE_URL}/auth/logout`)
      .set("Cookie", ["jwt_token=jwttokenvalue123"]);
    expect(jwt_in_cookies(res)).toBe(false);
    expect(res.status).toBe(200);
  });
  test("logout with no jwt token in cookies", async () => {
    const res = await request(app)
      .get(`${BASE_URL}/auth/logout`);
    expect(jwt_in_cookies(res)).toBe(false);
    expect(res.status).toBe(200);
  });
});

describe("Change Password tests", () => {
  describe("changing password with authorized user", () => {
    let jwt_token: string;
    beforeEach(async () => {
      const res = await request(app)
        .post(`${BASE_URL}/auth/login`)
        .send({ username: "test_username", password: "test_password" });
      jwt_token = get_jwt_token(res);
    });
    afterEach(async () => {
      await db.change_user_password("test_username", HASH);
    });

    test("checking with correct old password and valid new password", async () => {
      const res = await request(app)
        .put(`${BASE_URL}/auth/change-password`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({ password: "test_password", new_password: "Test_password_changed_1" });
      expect(res.status).toBe(200);
    });
    test("checking with wrong old password and valid new password", async () => {
      const res = await request(app)
        .put(`${BASE_URL}/auth/change-password`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({ password: "wrong_password", new_password: "Test_password_changed_1" });
      expect(res.status).toBe(403);
    });
    test("checking with no old password and valid new password", async () => {
      const res = await request(app)
        .put(`${BASE_URL}/auth/change-password`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({ password: "", new_password: "Test_password_changed_1" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Գաղտնաբառը բացակայում է");
    });
    test("checking with old password of wrong types and valid new password", async () => {
      const wrong_password_types = [1, 0, true, false, null, undefined, NaN, {}, [], () => {}];
      for (const password of wrong_password_types) {
        const password_json = JSON.parse(JSON.stringify({ key: password })).key;
        const res = await request(app)
          .put(`${BASE_URL}/auth/change-password`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({ password, new_password: "Test_password_changed_1" });
        expect(res.status).toBe(400);
        // @ts-ignore
        expect(res.body.message).toBe(`typeof password is ${typeof password_json}`);
      }
    });
    test("checking with correct old password and new password of invalid types", async () => {
      const wrong_password_types = [1, 0, true, false, null, undefined, NaN, {}, [], () => {}];
      for (const new_password of wrong_password_types) {
        const password_json = JSON.parse(JSON.stringify({ key: new_password })).key;
        const res = await request(app)
          .put(`${BASE_URL}/auth/change-password`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({ password: "test_password", new_password });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof new_password is ${typeof password_json}`)
      }
    });
    test("checking with correct old password and no new password", async () => {
      const res = await request(app)
        .put(`${BASE_URL}/auth/change-password`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({ password: "test_password", new_password: "" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Նոր գաղտնաբառը բացակայում է");
    });
    test("checking with correct old password and new password of invalid format", async () => {
      const invalid_format_passwords = [
        "no_capital_letter_1",
        "Nospecialcharacter1",
        "No_numeric_character",
        "Short_1",
        "Too_long_password_1234567890_1234"
      ];
      for (const new_password of invalid_format_passwords) {
        const res = await request(app)
          .put(`${BASE_URL}/auth/change-password`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({ password: "test_password", new_password });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Գաղտնաբառը պետք է ունենա առնվազն 8 և առավելագույնը 32 նիշ երկարություն և պարունակի հետևյալ նիշերից յուրաքանչյուրը. մեծատառ տառ, փոքրատառ տառ, թվանշան, հատուկ նշան (!,@,#,$,%,^,&,*,(,),?,>,<,-,_,{,})");
      }
    });
  });
  test("changing password with unauthorized user", async () => {
    const res = await request(app)
      .put(`${BASE_URL}/auth/change-password`)
      .set("Cookie", ["jwt_token=expired_token"])
      .send({ password: "test_password", new_password: "Test_password_changed_1" });
    expect(res.status).toBe(403);
  });
});