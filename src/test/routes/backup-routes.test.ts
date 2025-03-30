import db_auth from "../../db/auth-methods";
import db_item from "../../db/item-methods";
import db_category from "../../db/category-methods";
import request from "supertest";
import { app, server, BASE_URL } from "../..";
import { get_jwt_token } from "../test-util";

beforeEach(async () => {
  await db_auth.populate_user_tbl();
  const id_list = await db_category.populate_category_tbl() as { id: string }[];
  await db_item.populate_item_tbl(id_list.map(c => c.id));
});
afterEach(async () => {
  await db_item.clear_item_tbl();
  await db_category.clear_category_tbl();
  await db_auth.clear_user_tbl();
  server.close();
});

describe("Backup Db tests", () => {
  test("backup with a authorized user", async () => {
    const login_response = await request(app)
        .post(`${BASE_URL}/auth/login`)
        .send({ username: "test_username", password: "test_password" });
    const jwt_token = get_jwt_token(login_response);
    server.close();
    const res = await request(app)
      .get(`${BASE_URL}/backup`)
      .set("Cookie", [`jwt_token=${jwt_token}`]);
    expect(res.status).toBe(200);
    for (const key in res.body) {
      for (const obj of res.body[key]) {
        let props: string[];
        if (key === "category_tbl") {
          props = ["id", "label_am", "label_ru"];
        } else if (key === "item_tbl") {
          props = ["id", "category_id", "name_am", "name_ru"];
        } else if (key === "item_photo_tbl") {
          props = ["id", "item_id", "src"];
        } else if (key === "item_size_tbl") {
          props = [ "id", "item_id", "size_value", "size_unit" ];
        } else if (key === "item_color_tbl") {
          props = [ "id", "item_id", "color_am", "color_ru" ];
        } else {
          props = [
            "item_id",         "photo_id",
            "price",           "promo",
            "size_id",         "color_id",
            "min_order_value", "min_order_unit",
            "description_am",  "description_ru",
            "special_group",   "available",
            "creation_date"
          ];
        }
        expect(Object.keys(obj)).toEqual(props);
      }
    }
  });
  test("backup with a not authorized user", async () => {
    const res = await request(app)
      .get(`${BASE_URL}/backup`);
    expect(res.status).toBe(401);
  });
  test("backup with an expired jwt_token", async () => {
    const res = await request(app)
      .get(`${BASE_URL}/backup`)
      .set("Cookie", ["jwt_token=expired_jwt_token"]);
    expect(res.status).toBe(403);
  });
});