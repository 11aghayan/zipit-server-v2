import Db from "../../db/auth-methods";

const password_hash = "$2b$10$3mBYnbs3dA4zrFYpSPx.re/JbM3c7z4AWHOJyxnIoQj.EspJj8BeO"; 

describe("Get credentials tests", () => {
  beforeAll(async () => {
    // Adds a user with username "test_username" and password_hash "$2b$10$3mBYnbs3dA4zrFYpSPx.re/JbM3c7z4AWHOJyxnIoQj.EspJj8BeO"
    await Db.populate_user_tbl();
  });
  afterAll(async () => {await Db.clear_user_tbl()});

  test("getting the password_hash of an existing user", async () => {
    const result = await Db.get_credentials("test_username");
    expect(result).toEqual({
      error: false,
      rows: [{
        password_hash
      }]
    });
  });
  test("getting the password_hash of a non existing user", async () => {
    const result = await Db.get_credentials("test_username_non_existing");
    expect(result).toEqual({
      error: false,
      rows: []
    });
  });
});

describe("Change password tests", () => {
  beforeAll(async () => {
    // Adds a user with username "test_username" and password_hash "test_hashed_password"
    await Db.populate_user_tbl();
  });
  afterAll(async () => {await Db.clear_user_tbl()});

  test("changing password_hash with a valid password_hash", async () => {
    const result = await Db.change_user_password("test_username", "test_hashed_password_changed");
    expect(result).toBeUndefined();
  });
  test("changing password_hash with a too long password_hash", async () => {
    let too_long_password_hash = "";
    for (let i = 0; i < 30; i++) {
      too_long_password_hash += "abc"
    }
    const result = await Db.change_user_password("test_username", too_long_password_hash);
    expect(result).toHaveProperty("error", true);
  });
  test("changing password_hash for a non existing user", async () => {
    const result = await Db.change_user_password("non_existing_username", "test_hashed_password_changed");
    expect(result).toBeUndefined();
  });
});