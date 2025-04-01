import db from "../../db/item-methods";
import db_category from "../../db/category-methods";
import db_auth from "../../db/auth-methods";
import request from "supertest";
import { server, app, BASE_URL } from "../..";
import { T_Item_Admin_Full } from "../../types";
import { Db_Error_Response } from "../../db/responses";
import sharp from "sharp";

const not_existing_id = "0a773263-ddaf-4c44-b5f0-8de15f81599f";
let items: T_Item_Admin_Full[] = [];

beforeEach(async () => {
  await db_auth.populate_user_tbl();
  const res = await db_category.populate_category_tbl() as { id: string }[];
  const category_id_list = res.map(c => c.id);
  const item_ids = await db.populate_item_tbl(category_id_list) as string[];
  items = [];
  for (const id of item_ids) {
    const res = await db.get_item_admin(id);
    if (res instanceof Db_Error_Response) {
      throw new Error(JSON.stringify(res.err));
    }
    items.push(res.rows[0]);
  }
});
afterEach(async () => {
  await db.clear_item_tbl();
  await db_category.clear_category_tbl();
  await db_auth.clear_user_tbl();
  server.close();
});

describe("Get photo tests", () => {
  test("getting photo with valid id, valid width, valid height, index 1", async () => {
    for (const item of items) {
      const res = await request(app)
        .get(`${BASE_URL}/photo/${item.photo_id}?width=300&height=300&index=1`);
      server.close();
      expect(res.status).toBe(200);
      const buffer = await get_resized_buffer_from_src(item.src[0], 300, 300);
      expect(res.body).toEqual(buffer);
    }
  });
  test("getting photo with invalid ids, valid width, valid height, index 1", async () => {
    for (const id of ["invalid_id", not_existing_id]) {
      const res = await request(app)
        .get(`${BASE_URL}/photo/${id}?width=300&height=300&index=1`);
      server.close();
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Photo fetching error");
    }
  });
  test("getting photo with valid id, [empty, spaces only, undefined] width values, valid height, index 1", async () => {
    for (const item of items) {
      for (const value of ["", " ", undefined]) {
        const res = await request(app)
          .get(`${BASE_URL}/photo/${item.photo_id}?${value === undefined ? "" : `width=${value}&`}height=300&index=1`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Image width not provided");
      }
    }
  });
  test("getting photo with valid id, non numeric width, valid height, index 1", async () => {
    for (const item of items) {
      const res = await request(app)
        .get(`${BASE_URL}/photo/${item.photo_id}?width=string&height=300&index=1`);
      server.close();
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Image width must be a numeric value");
    }
  });
  test("getting photo with valid id, 0 and negative width, valid height, index 1", async () => {
    for (const item of items) {
      for (const value of [0, -300]) {
        const res = await request(app)
          .get(`${BASE_URL}/photo/${item.photo_id}?width=${value}&height=300&index=1`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Image width must be value greater than or equal to 1");
      }
    }
  });
  test("getting photo with valid id, valid width, [empty, spaces only, undefined] height values, index 1", async () => {
    for (const item of items) {
      for (const value of ["", " ", undefined]) {
        const res = await request(app)
          .get(`${BASE_URL}/photo/${item.photo_id}?${value === undefined ? "" : `height=${value}&`}width=300&index=1`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Image height not provided");
      }
    }
  });
  test("getting photo with valid id, valid width, non numeric height, index 1", async () => {
    for (const item of items) {
      const res = await request(app)
        .get(`${BASE_URL}/photo/${item.photo_id}?width=300&height=string&index=1`);
      server.close();
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Image height must be a numeric value");
    }
  });
  test("getting photo with valid id, valid width, 0 and negative height, index 1", async () => {
    for (const item of items) {
      for (const value of [0, -300]) {
        const res = await request(app)
          .get(`${BASE_URL}/photo/${item.photo_id}?width=300&height=${value}&index=1`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Image height must be value greater than or equal to 1");
      }
    }
  });
  test("getting photo with valid id, valid width, valid height, index 3", async () => {
    for (const item of items) {
      const res = await request(app)
        .get(`${BASE_URL}/photo/${item.photo_id}?width=300&height=300&index=3`);
      server.close();
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Photo fetching error");
    }
  });
  test("getting photo with valid id, valid width, valid height, index [0, -1]", async () => {
    for (const item of items) {
      for (const value of [0, -1]) {
        const res = await request(app)
          .get(`${BASE_URL}/photo/${item.photo_id}?width=300&height=300&index=${value}`);
        server.close();
        expect(res.status).toBe(200);
        const buffer = await get_resized_buffer_from_src(item.src[0], 300, 300);
        expect(res.body).toEqual(buffer);
      }
    }
  });
});

async function get_resized_buffer_from_src(src: string, height: number, width: number) {
  const img_data = src.split(";")[1];
  const buffer = Buffer.from(img_data.split(",")[1], "base64");
  const resized_buffer = await sharp(buffer).resize({ height, width, fit: "inside" }).toBuffer();
  return resized_buffer;
}
