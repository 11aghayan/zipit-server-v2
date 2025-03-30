import db from "../../db/item-methods";
import db_category from "../../db/category-methods";
import db_auth from "../../db/auth-methods";
import request from "supertest";
import { server, app, BASE_URL } from "../..";
import { Db_Error_Response, Db_Success_Response } from "../../db/responses";
import { T_ID, T_Item_Admin_Full, T_Item_Admin_Full_Response, T_Item_Admin_Variant } from "../../types";
import { get_jwt_token, valid_photo_src } from "../test-util";

const not_existing_id = "0a773263-ddaf-4c44-b5f0-8de15f81599f";
const lang_list = ["am", "ru"] as const;
const special_group_filters = ["prm", "new", "liq", null] as const;
const count_filters = ["25", "50", "75", "100"] as const;
const page_filters = ["1", "2"] as const;
const search_filters = ["name_am_1", "name_am_2"] as const;
const sorting_filters_keys = ["name", "price"] as const;
const sorting_filters_directions = ["asc", "desc"] as const;
let category_filters: (string | null)[];
let item_id_list: string[];
let category_id_list: string[];

beforeEach(async () => {
  await db_auth.populate_user_tbl();
  const res = await db_category.populate_category_tbl() as { id: string }[];
  category_id_list = res.map(c => c.id);
  item_id_list = await db.populate_item_tbl(category_id_list) as string[];
  category_filters = [category_id_list[0], category_id_list[1], null];
});

afterEach(async () => {
  await db.clear_item_tbl();
  await db_category.clear_category_tbl();
  await db_auth.clear_user_tbl();
  server.close();
});

describe("Public routes tests", () => {
  describe("Get All Items tests", () => {
    test("getting items with valid lang, valid filters, valid sorting", async () => {
      for (const lang of lang_list) {
        for (const special_group of special_group_filters) {
          for (const count of count_filters) {
            for (const page of page_filters) {
              for (const category of category_filters) {
                for (const search of search_filters) {
                  for (const sort_key of sorting_filters_keys) {
                    for (const sort_dir of sorting_filters_directions) {
                      const res = await request(app)
                        .get(`${BASE_URL}/items/public/all?lang=${lang}&categories=${category}&special_groups=${special_group}&count=${count}&page=${page}&search=${search}&sortby=${sort_key}_${sort_dir}`);
                      server.close();
                      expect(res.status).toBe(200);
                      expect(typeof res.body.items_count).toBe("number");
                      expect(typeof res.body.pages).toBe("number");
                      expect(Array.isArray(res.body.items)).toBe(true);
                      expect(res.body.items.length === res.body.items_count).toBe(true);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }, 10000);
    test("getting items with invalid lang, valid filters, valid sorting", async () => {
      for (const lang of ["arm", "rus", "en", "es", "de"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/public/all?lang=${lang}&categories=null&special_groups=null&count=25&page=1&sortby=name_asc`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`lang must be either am or ru, you provided ${lang}`);
      } 
    });
    test("getting items with valid lang, invalid categories, valid sorting", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=invalid_id&special_groups=null&count=25&page=1&sortby=name_asc`);
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Items fetching error");
    });
    test("getting items with valid lang, invalid special_groups, valid sorting", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=null&special_groups=invalid&count=25&page=1&sortby=name_asc`);
      expect(res.status).toBe(200);
      expect(res.body.items_count).toBe(0);
      expect(res.body.pages).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);
    });
    test("getting items with valid lang, invalid special_groups, valid sorting", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=null&special_groups=null&count=invalid&page=1&sortby=name_asc`);
      expect(res.status).toBe(200);
      expect(res.body.items_count).toBe(4);
      expect(res.body.pages).toBe(1);
      expect(Array.isArray(res.body.items)).toBe(true);
    });
    test("getting items with valid lang, invalid special_groups, valid sorting", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=null&special_groups=null&count=25&page=invalid&sortby=name_asc`);
      expect(res.status).toBe(200);
      expect(res.body.items_count).toBe(4);
      expect(res.body.pages).toBe(1);
      expect(Array.isArray(res.body.items)).toBe(true);
    });
    test("getting items with valid lang, valid filters, invalid sorting key", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=null&special_groups=null&count=25&page=invalid&sortby=invalid_asc`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid sorting key");
    });
    test("getting items with valid lang, valid filters, invalid sorting direction", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am&categories=null&special_groups=null&count=25&page=invalid&sortby=name_invalid`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid sorting direction");
    });
  });

  describe("Get Item tests", () => {
    test("getting item with valid lang, existing id", async () => {
      for (const lang of lang_list) {
        for (const id of item_id_list) {
          const res = await request(app)
            .get(`${BASE_URL}/items/item/public/${id}?lang=${lang}`);
          server.close();
          expect(res.status).toBe(200);
          expect(res.body.variants).toBe(1);
          const item = res.body.item;
          expect(typeof item.id).toBe("string");
          expect(typeof item.category_id).toBe("string");
          expect(typeof item.category).toBe("string");
          expect(typeof item.name).toBe("string");
          expect(item.variants).toHaveLength(1);
          const category_lang = item.category.split("_")[1];
          const name_lang = item.category.split("_")[1];
          expect(category_lang).toBe(lang);
          expect(name_lang).toBe(lang);
        }
      }
    });
    test("getting item with valid lang, not existing id", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/item/public/${not_existing_id}?lang=${lang}`);
        server.close();
        expect(res.status).toBe(404);
      }
    });
    test("getting item with valid lang, invalid id", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/item/public/invalid_id?lang=${lang}`);
        server.close();
        expect(res.status).toBe(500);
      }
    });
    test("getting item with invalid lang, existing id", async () => {
      for (const lang of ["arm", "rus", "en", "de"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/item/public/invalid_id?lang=${lang}`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`lang must be either am or ru, you provided ${lang}`);
      }
    });
  });

  describe("Get Suggested Items tests", () => {
    test("getting items with valid lang", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/public/suggestions?lang=${lang}`);
        server.close();
        expect(res.status).toBe(200);
        expect(typeof res.body.items_count).toBe("number");
        expect(typeof res.body.pages).toBe("number");
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.items_count).toBe(true);
      }
    });
    test("getting items with invalid lang", async () => {
      for (const lang of ["arm", "rus", "en", "de"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/public/suggestions?lang=${lang}`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`lang must be either am or ru, you provided ${lang}`);
      }
    });
  });

  describe("Get Similar Items tests", () => {
    test("getting items with valid lang, valid item_id, valid_category_id, valid size unit, valid special group", async () => {
      for (const lang of lang_list) {
        for (const id of item_id_list) {
          const db_res = await db.get_item_admin(id);
          if (db_res instanceof Db_Error_Response) {
            expect(db_res).toBe(1);
            return;
          }
          const item = db_res.rows[0];
          const res = await request(app)
            .get(`${BASE_URL}/items/public/similar?lang=${lang}&category_id=${item.category_id}&item_id=${id}&special_groups=${item.special_group}&size_unit=${item.size_unit}`);
          server.close();
          expect(res.status).toBe(200);
          expect(typeof res.body.items_count).toBe("number");
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items_count).toBe(res.body.items.length);
          expect(res.body.items_count).toBe(3);
        }
      }
    });
    test("getting items with invalid lang, valid item_id, valid_category_id, valid size unit, valid special group", async () => {
      for (const id of item_id_list) {
        const db_res = await db.get_item_admin(id);
        if (db_res instanceof Db_Error_Response) {
          expect(db_res).toBe(1);
          return;
        }
        const item = db_res.rows[0];
        const res = await request(app)
          .get(`${BASE_URL}/items/public/similar?lang=invalid_lang&category_id=${item.category_id}&item_id=${id}&special_groups=${item.special_group}&size_unit=${item.size_unit}`);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("lang must be either am or ru, you provided invalid_lang");
      }
    });
    test("getting items with valid lang, invalid item_id, valid_category_id, valid size unit, valid special group", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/public/similar?lang=${lang}&category_id=${category_id_list[0]}&item_id=${not_existing_id}&special_groups=null&size_unit=num`);
        server.close();
        expect(res.status).toBe(200);
        expect(typeof res.body.items_count).toBe("number");
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items_count).toBe(res.body.items.length);
        expect(res.body.items_count).toBe(4);
      }
    });
    test("getting items with valid lang, valid item_id, invalid_category_id, valid size unit, valid special group", async () => {
      for (const lang of lang_list) {
        for (const id of item_id_list) {
          const db_res = await db.get_item_admin(id);
          if (db_res instanceof Db_Error_Response) {
            expect(db_res).toBe(1);
            return;
          }
          const item = db_res.rows[0];
          const res = await request(app)
            .get(`${BASE_URL}/items/public/similar?lang=${lang}&category_id=${not_existing_id}&item_id=${id}&special_groups=${item.special_group}&size_unit=${item.size_unit}`);
          server.close();
          expect(res.status).toBe(200);
          expect(typeof res.body.items_count).toBe("number");
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items_count).toBe(res.body.items.length);
          expect(res.body.items_count).toBe(3);
        }
      }
    });
    test("getting items with valid lang, valid item_id, valid_category_id, invalid size unit, valid special group", async () => {
      for (const lang of lang_list) {
        for (const id of item_id_list) {
          const db_res = await db.get_item_admin(id);
          if (db_res instanceof Db_Error_Response) {
            expect(db_res).toBe(1);
            return;
          }
          const item = db_res.rows[0];
          const res = await request(app)
            .get(`${BASE_URL}/items/public/similar?lang=${lang}&category_id=${item.category_id}&item_id=${id}&special_groups=${item.special_group}&size_unit=invalid_size_unit`);
          server.close();
          expect(res.status).toBe(200);
          expect(typeof res.body.items_count).toBe("number");
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items_count).toBe(res.body.items.length);
          expect(res.body.items_count).toBe(3);
        }
      }
    });
    test("getting items with valid lang, valid item_id, valid_category_id, valid size unit, invalid special group", async () => {
      for (const lang of lang_list) {
        for (const id of item_id_list) {
          const db_res = await db.get_item_admin(id);
          if (db_res instanceof Db_Error_Response) {
            expect(db_res).toBe(1);
            return;
          }
          const item = db_res.rows[0];
          const res = await request(app)
            .get(`${BASE_URL}/items/public/similar?lang=${lang}&category_id=${item.category_id}&item_id=${id}&special_groups=invalid&size_unit=${item.size_unit}`);
          server.close();
          expect(res.status).toBe(200);
          expect(typeof res.body.items_count).toBe("number");
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items_count).toBe(res.body.items.length);
          expect(res.body.items_count).toBe(3);
        }
      }
    });
  });

  describe("Get Cart Items tests", () => {
    let item_id: T_ID;
    let photo_id: T_ID;

    beforeEach(async () => {
      const db_res = await db.get_item_admin(item_id_list[0]) as Db_Success_Response<T_Item_Admin_Full>;
      item_id = db_res.rows[0].id;
      photo_id = db_res.rows[0].photo_id;
    });
    
    test("getting items with valid lang, valid body.items", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
          .send({ items: [{item_id, photo_id}] });
        server.close();
        expect(res.status).toBe(200);
        expect(typeof res.body.items_count).toBe("number");
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.items_count).toBe(true);
        expect(res.body.items_count).toBe(1);
      }
    });
    test("getting items with invalid lang, valid body.items", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/public/cart?lang=invalid`)
        .send({ items: [{item_id, photo_id}] });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("lang must be either am or ru, you provided invalid");
    });
    test("getting items with valid lang, wrong type of body.items", async () => {
      for (const lang of lang_list) {
        for (const items of [0, 1, "", "string", true, false, undefined, null, NaN, {}, () => {}]) {
          const res = await request(app)
            .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
            .send({ items });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("No items or items is not iterable");
        }
      }
    });
    test("getting items with valid lang, no item_id in body.items", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
          .send({ items: [{ photo_id }] });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("No Item ID or Item ID of wrong type");
      }
    });
    test("getting items with valid lang, wrong types of item_id in body.items", async () => {
      for (const lang of lang_list) {
        for (const item_id of [0, 1, "", true, false, undefined, null, NaN, {}, [], () => {}]) {
          const res = await request(app)
            .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
            .send({ items: [{ item_id, photo_id }] });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("No Item ID or Item ID of wrong type");
        }
      }
    });
    test("getting items with valid lang, no photo_id in body.items", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
          .send({ items: [{ item_id }] });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("No Photo ID or Photo ID of wrong type");
      }
    });
    test("getting items with valid lang, wrong types of photo_id in body.items", async () => {
      for (const lang of lang_list) {
        for (const photo_id of [0, 1, "", true, false, undefined, null, NaN, {}, [], () => {}]) {
          const res = await request(app)
            .post(`${BASE_URL}/items/public/cart?lang=${lang}`)
            .send({ items: [{ item_id, photo_id }] });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("No Photo ID or Photo ID of wrong type");
        }
      }
    });
  });

  describe("Search tests", () => {
    test("searching with valid lang, valid query, limit 2", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/search?lang=${lang}&query=category_am_1&limit=2`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        expect(res.body.items.every((i: { name: string }) => Number(i.name.split("_").at(-1)) % 2 !== 0)).toBe(true);
      }
    });
    test("searching with invalid lang, valid query, limit 2", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/search?lang=invalid&query=category_am_1&limit=2`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("lang must be either am or ru, you provided invalid");
    });
    test("searching with valid lang, empty query", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/search?lang=${lang}&query=&limit=2`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
      }
    });
    test("searching with valid lang, only spaces query", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/search?lang=${lang}&query=  &limit=2`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
      }
    });
    test("searching with valid lang, valid query, invalid limits", async () => {
      for (const lang of lang_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/search?lang=${lang}&query=category_am_2&limit=invalid`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        expect(res.body.items.every((i: { name: string }) => Number(i.name.split("_").at(-1)) % 2 === 0)).toBe(true);
      }
    });
  });
});

describe("Admin routes tests", () => {
  let jwt_token: string;
  
  beforeEach(async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: "test_password" });
    jwt_token = get_jwt_token(res);
  });
  
  describe("Get All Items tests", () => {
    test("getting all items with authorized user, valid special groups, categories null, count 10, page 1, empty search, sortby name_asc", async () => {
      for (const special_group of [null, "prm"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/admin/all?special_groups=${special_group}&categories=null&count=10&page=1&search=&sortby=name_asc`)
          .set("Cookie", `jwt_token=${jwt_token}`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.pages).toBe(1);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        if (special_group === "prm") {
          expect(res.body.length).toBe(1);
        } else {
          expect(res.body.length).toBe(4);
        }
        expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
        const sorted_items = res.body.items.toSorted((a: {name: string}, b: {name: string}) => a.name > b.name ? 1 : -1);
        expect(res.body.items).toEqual(sorted_items);
      }
    });
    test("getting all items with authorized user, special groups null, valid categories, count 10, page 1, empty search, sortby name_asc", async () => {
      for (const category_id of [null, category_id_list[0], category_id_list[1]]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=${category_id}&count=10&page=1&search=&sortby=name_asc`)
          .set("Cookie", `jwt_token=${jwt_token}`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.pages).toBe(1);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        if (category_id === null) {
          expect(res.body.length).toBe(4);
        } else {
          expect(res.body.length).toBe(2);
        }
        expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
        const sorted_items = res.body.items.toSorted((a: {name: string}, b: {name: string}) => a.name > b.name ? 1 : -1);
        expect(res.body.items).toEqual(sorted_items);
      }
    });
    test("getting all items with authorized user, special groups null, categories null, count 1, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=1&page=1&search=&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(4);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 2, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=2&search=&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(0);
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 1, search name_am_1, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=name_am_1&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(1);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item && item.name === "name_am_1")).toBe(true);
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 1, search 'non_existing_name', sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=non_existing_name&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(0);
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 1, empty search, sortby name_desc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=&sortby=name_desc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(1);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(4);
      expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
      const sorted_items = res.body.items.toSorted((a: {name: number}, b: {name: number}) => a.name > b.name ? -1 : 1);
      expect(res.body.items).toEqual(sorted_items);
    });
    test("getting all items with authorized user, invalid special group, categories null, count 10, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=invalid&categories=null&count=10&page=1&search=&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.pages).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
      expect(res.body.length).toBe(0);
    });
    test("getting all items with authorized user, special groups null, invalid category id, count 10, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=invalid&count=10&page=1&search=&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Items fetching error");
    });
    test("getting all items with authorized user, special groups null, non existing category id, count 10, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=${not_existing_id}&count=10&page=1&search=&sortby=name_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
      expect(res.body.pages).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length === res.body.length).toBe(true);
    });
    test("getting all items with authorized user, special groups null, categories null, invalid counts, page 1, empty search, sortby name_asc", async () => {
      for (const count of [-1, "invalid"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=${count}&page=1&search=&sortby=name_asc`)
          .set("Cookie", `jwt_token=${jwt_token}`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(4);
        expect(res.body.pages).toBe(1);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
        const sorted_items = res.body.items.toSorted((a: {name: string}, b: {name: string}) => a.name > b.name ? 1 : -1);
        expect(res.body.items).toEqual(sorted_items);
      }
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, invalid pages, empty search, sortby name_desc", async () => {
      for (const page of [0, -1, "invalid"]) {
        const res = await request(app)
          .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=${page}&search=&sortby=name_asc`)
          .set("Cookie", `jwt_token=${jwt_token}`);
        server.close();
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(4);
        expect(res.body.pages).toBe(1);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length === res.body.length).toBe(true);
        expect(res.body.items.every((item: object) => "id" in item && "name" in item && "photo_id" in item && "count" in item)).toBe(true);
        const sorted_items = res.body.items.toSorted((a: {name: string}, b: {name: string}) => a.name > b.name ? 1 : -1);
        expect(res.body.items).toEqual(sorted_items);
      }
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 1, empty search, sortby invalid_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=&sortby=invalid_asc`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid sorting key");
    });
    test("getting all items with authorized user, special groups null, categories null, count 10, page 1, empty search, sortby name_invalid", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=&sortby=name_invalid`)
        .set("Cookie", `jwt_token=${jwt_token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid sorting direction");
    });
    test("getting all items with unauthorized user, valid special groups, categories null, count 10, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=&sortby=name_asc`);
      expect(res.status).toBe(401);
    });
    test("getting all items with invalid jwt_token user, valid special groups, categories null, count 10, page 1, empty search, sortby name_asc", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/admin/all?special_groups=null&categories=null&count=10&page=1&search=&sortby=name_asc`)
        .set("Cookie", ["jwt_token=invalid_token"]);
      expect(res.status).toBe(403);
    });
  });
  describe("Get Item tests", () => {
    test("getting item with authorized user, existing id", async () => {
      for (const id of item_id_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/item/admin/${id}`)
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(200);
        const item = res.body.item;
        expect(typeof item).toBe("object");
        expect(typeof item.id).toBe("string");
        expect(typeof item.category_id).toBe("string");
        expect(typeof item.name_am).toBe("string");
        expect(typeof item.name_ru).toBe("string");
        expect(Array.isArray(item.variants)).toBe(true);
        for (const variant of item.variants) {
          expect(variant.item_id).toBe(item.id);
          expect(typeof variant.photo_id).toBe("string");
          expect(typeof variant.size_id).toBe("string");
          expect(typeof variant.color_id).toBe("string");
          expect(typeof variant.price).toBe("number");
          expect(["number", "null"]).toContain(variant.promo === null ? "null" : typeof variant.promo);
          expect(typeof variant.min_order_value).toBe("number");
          expect(variant.min_order_unit).toBe("box");
          expect(typeof variant.size_value).toBe("number");
          expect(variant.size_unit).toBe("num");
          expect(typeof variant.description_am).toBe("string");
          expect(typeof variant.description_ru).toBe("string");
          expect(typeof variant.color_am).toBe("string");
          expect(typeof variant.color_ru).toBe("string");
          expect(["prm", null]).toContain(variant.special_group);
          expect(variant.available).toBe(1);
          expect(typeof variant.creation_date).toBe("number");
          expect(variant.src).toEqual([valid_photo_src, valid_photo_src]);
        }
      }
    });
    test("getting item with authorized user, not existing id", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/item/admin/${not_existing_id}`)
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("No items found");
    });
    test("getting item with authorized user, invalid id", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/item/admin/invalid`)
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Item fetching error");
    });
    test("getting item with unauthorized user, existing id", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/item/admin/${item_id_list[0]}`);
      expect(res.status).toBe(401);
    });
    test("getting item with invalid jwt_token, existing id", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/items/item/admin/${item_id_list[0]}`)
        .set("Cookie", [`jwt_token=invalid`]);
      expect(res.status).toBe(403);
    });
  });
  describe("Add Item tests", () => {
    let valid_item: object;
    beforeEach(async () => {
      valid_item = {
        category_id: category_id_list[0],
        name_am: "name_am_added",
        name_ru: "name_ru_added",
        variants: [
          {
            price: 70,
            promo: 30,
            size_unit: "cm",
            size_value: 7,
            color_am: "color_am_added",
            color_ru: "color_ru_added",
            min_order_unit: "roll",
            min_order_value: 7,
            description_am: "  ",
            description_ru: null,
            src: [valid_photo_src],
            special_group: "new",
            available: 1
          }
        ]
      };
    });
    
    test("adding item with authorized user, valid data", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send(valid_item);
      expect(res.status).toBe(200);
      const item = res.body.item;
      expect(typeof item.id).toBe("string");
      expect(typeof item.category_id).toBe("string");
      expect(item.name_am).toBe("name_am_added");
      expect(item.name_ru).toBe("name_ru_added");
      expect(Array.isArray(item.variants)).toBe(true);
      const variant = item.variants[0];
      expect(variant.item_id).toBe(item.id);
      expect(typeof variant.photo_id).toBe("string");
      expect(typeof variant.size_id).toBe("string");
      expect(typeof variant.color_id).toBe("string");
      expect(variant.price).toBe(70);
      expect(variant.promo).toBe(30);
      expect(variant.min_order_value).toBe(7);
      expect(variant.min_order_unit).toBe("roll");
      expect(variant.size_value).toBe(7);
      expect(variant.size_unit).toBe("cm");
      expect(variant.description_am).toBe(null);
      expect(variant.description_ru).toBe(null);
      expect(variant.color_am).toBe("color_am_added");
      expect(variant.color_ru).toBe("color_ru_added");
      expect(variant.special_group).toBe("new");
      expect(variant.available).toBe(1);
      expect(typeof variant.creation_date).toBe("number");
      expect(variant.src).toEqual([valid_photo_src]);
    });
    test("adding item with authorized user, invalid category id types", async () => {
      for (const category_id of [0, 1, false, true, undefined, null, NaN, () => {}, {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            category_id
          });
        server.close();
        const category_id_json = JSON.parse(JSON.stringify({ key: category_id })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof category_id is ${typeof category_id_json}`);
      }
    });
    test("adding item with authorized user, empty and only spaces category id", async () => {
      for (const category_id of ["", "  "]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            category_id
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("category_id not provided");
      }
    });
    test("adding item with authorized user, invalid name am types", async () => {
      for (const name_am of [0, 1, false, true, undefined, null, NaN, () => {}, {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            name_am
          });
        server.close();
        const name_am_json = JSON.parse(JSON.stringify({ key: name_am })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof name_am is ${typeof name_am_json}`);
      }
    });
    test("adding item with authorized user, invalid name ru types", async () => {
      for (const name_ru of [0, 1, false, true, undefined, null, NaN, () => {}, {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            name_ru
          });
        server.close();
        const name_ru_json = JSON.parse(JSON.stringify({ key: name_ru })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof name_ru is ${typeof name_ru_json}`);
      }
    });
    test("adding item with authorized user, empty and only spaces name am", async () => {
      for (const name_am of ["", "  "]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            name_am
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Հայերեն անվանումը նշված չէ");
      }
    });
    test("adding item with authorized user, empty and only spaces name ru", async () => {
      for (const name_ru of ["", "  "]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            name_ru
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Ռուսերեն անվանումը նշված չէ");
      }
    });
    test("adding item with authorized user, invalid variants types", async () => {
      for (const variants of ["", "abcd", 0, 1, false, true, undefined, null, NaN, {}, () => {}]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("variants is not iterable");
      }
    });
    test("adding item with authorized user, empty variants", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({
          ...valid_item,
          variants: []
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Ապրանքը պետք է ունենա առնվազն մեկ տարբերակ");
    });
    test("adding item with authorized user, invalid variant price types", async () => {
      for (const price of ["", "abcd", false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                price
              }
            ]
          });
        server.close();
        const price_json = JSON.parse(JSON.stringify({ key: price })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof price is ${typeof price_json}`);
      }
    });
    test("adding item with authorized user, invalid variant price values", async () => {
      for (const price of [-1, 0]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                price
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Գինը պետք է լինի 0-ից մեծ արժեք");
      }
    });
    test("adding item with authorized user, invalid variant promo types", async () => {
      for (const promo of ["", "abcd", false, true, undefined, {}, () => {}]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                promo
              }
            ]
          });
        server.close();
        const promo_json = JSON.parse(JSON.stringify({ key: promo })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof promo is ${typeof promo_json}`);
      }
    });
    test("adding item with authorized user, variant promo -1", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({
          ...valid_item,
          variants: [
            {
              // @ts-ignore
              ...valid_item.variants[0],
              promo: -1
            }
          ]
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Ակցիան պետք է լինի 0 կամ 0-ից մեծ արժեք");
    });
    test("adding item with authorized user, invalid variant size value types", async () => {
      for (const size_value of ["", "abcd", false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                size_value
              }
            ]
          });
        server.close();
        const size_value_json = JSON.parse(JSON.stringify({ key: size_value })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof size_value is ${typeof size_value_json}`);
      }
    });
    test("adding item with authorized user, invalid variant size value values", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({
          ...valid_item,
          variants: [
            {
              // @ts-ignore
              ...valid_item.variants[0],
              size_value: -1
            }
          ]
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Չափի արժեքը պետք է լինի 0 և մեծ արժեք");
    });
    test("adding item with authorized user, invalid variant size unit types", async () => {
      for (const size_unit of [0, 1, false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                size_unit
              }
            ]
          });
        server.close();
        const size_unit_json = JSON.parse(JSON.stringify({ key: size_unit })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof size_unit is ${typeof size_unit_json}`);
      }
    });
    test("adding item with authorized user, invalid variant size unit values", async () => {
      for (const size_unit of ["", " ", "invalid"]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                size_unit
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`invalid size_unit: ${size_unit}`);
      }
    });
    test("adding item with authorized user, invalid variant color am types", async () => {
      for (const color_am of [0, 1, false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                color_am
              }
            ]
          });
        server.close();
        const color_am_json = JSON.parse(JSON.stringify({ key: color_am })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof color_am is ${typeof color_am_json}`);
      }
    });
    test("adding item with authorized user, invalid variant color ru types", async () => {
      for (const color_ru of [0, 1, false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                color_ru
              }
            ]
          });
        server.close();
        const color_ru_json = JSON.parse(JSON.stringify({ key: color_ru })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof color_ru is ${typeof color_ru_json}`);
      }
    });
    test("adding item with authorized user, empty and only spaces variant color am", async () => {
      for (const color_am of ["", "  "]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                color_am
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Գույնի հայերեն անվանումը նշված չէ");
      }
    });
    test("adding item with authorized user, empty and only spaces variant color ru", async () => {
      for (const color_ru of ["", "  "]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                color_ru
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Գույնի ռուսերեն անվանումը նշված չէ");
      }
    });
    test("adding item with authorized user, invalid variant min order value types", async () => {
      for (const min_order_value of ["", "1", false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                min_order_value
              }
            ]
          });
        server.close();
        const min_order_value_json = JSON.parse(JSON.stringify({ key: min_order_value })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof min_order_value is ${typeof min_order_value_json}`);
      }
    });
    test("adding item with authorized user, invalid variant min order value values", async () => {
      for (const min_order_value of [0, -1]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                min_order_value
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք");
      }
    });
    test("adding item with authorized user, invalid variant min order unit types", async () => {
      for (const min_order_unit of [0, 1, false, true, undefined, null, NaN, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                min_order_unit
              }
            ]
          });
        server.close();
        const min_order_unit_json = JSON.parse(JSON.stringify({ key: min_order_unit })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof min_order_unit is ${typeof min_order_unit_json}`);
      }
    });
    test("adding item with authorized user, invalid variant min order unit values", async () => {
      for (const min_order_unit of ["", " ", "mm"]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                min_order_unit
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`invalid min_order_unit: ${min_order_unit}`);
      }
    });
    test("adding item with authorized user, invalid variant description am types", async () => {
      for (const description_am of [0, 1, false, true, undefined, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                description_am
              }
            ]
          });
        server.close();
        const description_am_json = JSON.parse(JSON.stringify({ key: description_am })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof description_am is ${typeof description_am_json}`);
      }
    });
    test("adding item with authorized user, invalid variant description ru types", async () => {
      for (const description_ru of [0, 1, false, true, undefined, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                description_ru
              }
            ]
          });
        server.close();
        const description_ru_json = JSON.parse(JSON.stringify({ key: description_ru })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof description_ru is ${typeof description_ru_json}`);
      }
    });
    test("adding item with authorized user, invalid variant photo src types", async () => {
      for (const src of ["", " ", "[]", 0, 1, false, true, undefined, NaN, null, {}, [], () => {}]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                src
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Լուսանկարը բացակայում է");
      }
    });
    test("adding item with authorized user, invalid variant photo src element types", async () => {
      for (const data of [0, 1, false, true, undefined, NaN, null, {}, () => {}, []]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                src: [data]
              }
            ]
          });
        server.close();
        const src_json = JSON.parse(JSON.stringify([data]))[0];
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof photo_src is ${typeof src_json}; index = 0`);
      }
    });
    test("adding item with authorized user, invalid variant photo src element values", async () => {
      for (const data of ["", "data:image/jpg", "abcdefghijklmnopqrstuvwxyz"]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                src: [data]
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Wrong photo data; index = 0");
      }
    });
    test("adding item with authorized user, invalid variant special groups", async () => {
      for (const special_group of [0, 1, false, true, "", "prom", "invalid", undefined, {}, [], () => {}]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                special_group
              }
            ]
          });
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Wrong special group");
      }
    });
    test("adding item with authorized user, invalid variant available types", async () => {
      for (const available of [false, true, "", "invalid", undefined, null, NaN, {}, [], () => {}]) {
        const res = await request(app)
          .post(`${BASE_URL}/items/item/admin`)
          .set("Cookie", [`jwt_token=${jwt_token}`])
          .send({
            ...valid_item,
            variants: [
              {
                // @ts-ignore
                ...valid_item.variants[0],
                available
              }
            ]
          });
        server.close();
        const available_json = JSON.parse(JSON.stringify({ key: available })).key;
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof available is ${typeof available_json}`);
      }
    });
    test("adding item with authorized user, invalid variant available values", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`])
        .send({
          ...valid_item,
          variants: [
            {
              // @ts-ignore
              ...valid_item.variants[0],
              available: -1
            }
          ]
        });
      server.close();
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք");
    });
    test("adding item with unauthorized user, valid data", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .send(valid_item);
      expect(res.status).toBe(401);
    });
    test("adding item with invalid jwt, valid data", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/items/item/admin`)
        .set("Cookie", ["jwt_token=invalid_token"])
        .send(valid_item);
      expect(res.status).toBe(403);
    });
  });
  describe("Edit Item tests", () => {
    let items: T_Item_Admin_Full_Response[];
    const valid_variant = {
      price: 70,
      promo: 30,
      size_unit: "cm",
      size_value: 7,
      color_am: "color_am_added",
      color_ru: "color_ru_added",
      min_order_unit: "roll",
      min_order_value: 7,
      description_am: "  ",
      description_ru: null,
      src: [valid_photo_src],
      special_group: "new",
      available: 1
    };
    
    beforeEach(async () => {
      const memory: T_Item_Admin_Full_Response[] = [];
      for (const id of item_id_list) {
        const res = await request(app)
          .get(`${BASE_URL}/items/item/admin/${id}`)
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        memory.push(res.body.item);
      }
      items = memory;
    });
    
    describe("Edit general info tests", () => {
      test("Edit names with valid value", async () => {
        for (const name of ["name_am", "name_ru"] as const) {
          for (const item of items) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                [name]: `${item[name]}_edited`
              });
            server.close();
            expect(res.status).toBe(200);
            expect(res.body.item[name]).toBe(`${item[name]}_edited`);
          }
        }
      });
      test("editing category_id with valid value", async () => {
        for (const item of items) {
          const category_id = category_id_list.find((cid) => cid !== item.category_id);
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              category_id
            });
          expect(res.status).toBe(200);
          expect(res.body.item.category_id).toBe(category_id);
        }
      });
      test("editing names with invalid type values", async () => {
        for (const name of ["name_am", "name_ru"] as const) {
          for (const item of items) {
            for (const value of [0, 1, false, true, undefined, null, NaN, {}, [], () => {}]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  [name]: value
                });
              server.close();
              const json_value = JSON.parse(JSON.stringify({ key: value })).key;
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`typeof ${name} is ${typeof json_value}`);
            }
          }
        }
      });
      test("editing category_id with invalid type value", async () => {
        for (const item of items) {
          for (const value of [0, 1, false, true, undefined, null, NaN, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                category_id: value
              });
            server.close();
            const json_value = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof category_id is ${typeof json_value}`);
          }
        }
      });
      test("editing names with empty and spaces only values", async () => {
        for (const name of ["name_am", "name_ru"] as const) {
          for (const item of items) {
            for (const value of ["", "  "]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  [name]: value
                });
              server.close();
              const lang = name === "name_am" ? "Հայերեն" : "Ռուսերեն";
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`${lang} անվանումը նշված չէ`);
            }
          }
        }
      });
      test("editing category_id with empty and spaces only value", async () => {
        for (const item of items) {
          for (const value of ["", "  "]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                category_id: value
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("category_id not provided");
          }
        }
      });
      test("editing with invalid category_id", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              category_id: "invalid_id"
            });
          expect(res.status).toBe(500);
          expect(res.body.message).toBe("Item editing error");
        }
      });
      test("editing with not_existing category_id", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              category_id: not_existing_id
            });
          expect(res.status).toBe(500);
          expect(res.body.message).toBe("Item editing error");
        }
      });
      test("editing with unauthorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .send({
              ...item,
              name_am: "name_am_edited"
            });
          expect(res.status).toBe(401);
        }
      });
      test("editing with invalid jwt, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", ["jwt_token=invalid_token"])
            .send({
              ...item,
              name_am: "name_am_edited"
            });
          expect(res.status).toBe(403);
        }
      });
    });
    describe("Add variant tests", () => {
      test("adding variant with authorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                ...item.variants,
                valid_variant
              ]
            });
          server.close();
          expect(res.status).toBe(200);
          expect(res.body.item.variants.some((v: T_Item_Admin_Variant) => v.price === 70 && v.color_am === "color_am_added")).toBe(true);
        }
      });
      test("adding variant with authorized user, invalid variant price types", async () => {
        for (const item of items) {
          for (const price of ["", "  ", "100", NaN, false, true, null, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    price
                  }
                ]
              });
            server.close();
            const price_json = JSON.parse(JSON.stringify({ key: price })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof price is ${typeof price_json}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant price values", async () => {
        for (const item of items) {
          for (const price of [-1, 0]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    price
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Գինը պետք է լինի 0-ից մեծ արժեք");
          }
        }
      });
      test("adding variant with authorized user, invalid variant promo types", async () => {
        for (const item of items) {
          for (const promo of ["", "  ", "100", false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    promo
                  }
                ]
              });
            server.close();
            const promo_json = JSON.parse(JSON.stringify({ key: promo })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof promo is ${typeof promo_json}`);
          }
        }
      });
      test("adding variant with authorized user, variant promo -1", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                ...item.variants,
                {
                  ...valid_variant,
                  promo: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Ակցիան պետք է լինի 0 կամ 0-ից մեծ արժեք");
        }
      });
      test("adding variant with authorized user, invalid variant size value types", async () => {
        for (const item of items) {
          for (const size_value of ["", "  ", "100", NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    size_value
                  }
                ]
              });
            server.close();
            const size_value_json = JSON.parse(JSON.stringify({ key: size_value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof size_value is ${typeof size_value_json}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant size value values", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                ...item.variants,
                {
                  ...valid_variant,
                  size_value: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Չափի արժեքը պետք է լինի 0 և մեծ արժեք");
        }
      });
      test("adding variant with authorized user, invalid variant size unit types", async () => {
        for (const item of items) {
          for (const size_unit of [-1, 0, 1, NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    size_unit
                  }
                ]
              });
            server.close();
            const size_unit_json = JSON.parse(JSON.stringify({ key: size_unit })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof size_unit is ${typeof size_unit_json}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant size unit values", async () => {
        for (const item of items) {
          for (const size_unit of ["", " ", "box"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    size_unit
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`invalid size_unit: ${size_unit}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant color types", async () => {
        for (const item of items) {
          for (const color of ["color_am", "color_ru"]) {
            for (const value of [-1, 0, 1, NaN, null, false, true, undefined, {}, [], () => {}]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    ...item.variants,
                    {
                      ...valid_variant,
                      [color]: value
                    }
                  ]
                });
              server.close();
              const value_json = JSON.parse(JSON.stringify({ key: value })).key;
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`typeof ${color} is ${typeof value_json}`);
            }
          }
        }
      });
      test("adding variant with authorized user, empty and only spaces variant color", async () => {
        for (const item of items) {
          for (const color of ["color_am", "color_ru"]) {
            for (const value of ["", "  "]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    ...item.variants,
                    {
                      ...valid_variant,
                      [color]: value
                    }
                  ]
                });
              server.close();
              const lang = color === "color_am" ? "հայերեն" : "ռուսերեն";
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`Գույնի ${lang} անվանումը նշված չէ`);
            }
          }
        }
      });
      test("adding variant with authorized user, invalid variant min order value types", async () => {
        for (const item of items) {
          for (const min_order_value of ["", "  ", "100", NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    min_order_value
                  }
                ]
              });
            server.close();
            const min_order_value_json = JSON.parse(JSON.stringify({ key: min_order_value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof min_order_value is ${typeof min_order_value_json}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant min order value values", async () => {
        for (const item of items) {
          for (const min_order_value of [-1, 0]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    min_order_value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք");
          }
        }
      });
      test("adding variant with authorized user, invalid variant min order unit types", async () => {
        for (const item of items) {
          for (const min_order_unit of [-1, 0, 1, NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    min_order_unit
                  }
                ]
              });
            server.close();
            const min_order_unit_json = JSON.parse(JSON.stringify({ key: min_order_unit })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof min_order_unit is ${typeof min_order_unit_json}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant min order unit values", async () => {
        for (const item of items) {
          for (const min_order_unit of ["", " ", "mm"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    min_order_unit
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`invalid min_order_unit: ${min_order_unit}`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant description types", async () => {
        for (const item of items) {
          for (const description of ["description_am", "description_ru"]) {
            for (const value of [-1, 0, 1, false, true, undefined, {}, [], () => {}]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    ...item.variants,
                    {
                      ...valid_variant,
                      [description]: value
                    }
                  ]
                });
              server.close();
              const value_json = JSON.parse(JSON.stringify({ key: value })).key;
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`typeof ${description} is ${typeof value_json}`);
            }
          }
        }
      });
      test("adding variant with authorized user, invalid variant photo src types", async () => {
        for (const item of items) {
          for (const src of ["", "  ", "[]", -1, 0, 1, NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    src
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Լուսանկարը բացակայում է");
          }
        }
      });
      test("adding variant with authorized user, invalid variant photo src element types", async () => {
        for (const item of items) {
          for (const photo_src of [-1, 0, 1, NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    src: [photo_src]
                  }
                ]
              });
            server.close();
            const photo_src_json = JSON.parse(JSON.stringify([photo_src]))[0];
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof photo_src is ${typeof photo_src_json}; index = 0`);
          }
        }
      });
      test("adding variant with authorized user, invalid variant photo src element values", async () => {
        for (const item of items) {
          for (const photo_src of ["data:image/123", "abcdefghijklmnopqrstuvwxyz"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    src: [photo_src]
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Wrong photo data; index = 0");
          }
        }
      });
      test("adding variant with authorized user, invalid variant special groups", async () => {
        for (const item of items) {
          for (const special_group of ["", "  ", "pm", -1, 0, 1, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    special_group
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Wrong special group");
          }
        }
      });
      test("adding variant with authorized user, invalid variant available types", async () => {
        for (const item of items) {
          for (const available of ["", "  ", "pm", NaN, null, false, true, undefined, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  ...item.variants,
                  {
                    ...valid_variant,
                    available
                  }
                ]
              });
            server.close();
            const available_json = JSON.parse(JSON.stringify({ key: available })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof available is ${typeof available_json}`);
          }
        }
      });
      test("adding variant with authorized user, variant available value -1", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                ...item.variants,
                {
                  ...valid_variant,
                  available: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք");
        }
      });
      test("adding variant with unauthorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .send({
              ...item,
              valid_variant
            });
          server.close();
          expect(res.status).toBe(401);
        }
      });
      test("adding variant with invalid jwt, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", ["jwt_token=invalid_token"])
            .send({
              ...item,
              valid_variant
            });
          server.close();
          expect(res.status).toBe(403);
        }
      });
    });
    describe("Edit variant tests", () => {
      test("editing variant with authorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  available: 0,
                  color_am: "color_am_edited",
                  color_ru: "color_ru_edited",
                  description_am: "description_am_edited",
                  description_ru: "description_ru_edited",
                  min_order_unit: "roll",
                  min_order_value: 3,
                  price: 300,
                  promo: 150,
                  size_unit: "cm",
                  size_value: 3,
                  special_group: "liq",
                  src: [valid_photo_src]
                }
              ]
            });
          server.close();
          expect(res.status).toBe(200);
          expect(res.body.item.variants).toHaveLength(1);
          const variant = res.body.item.variants[0] as T_Item_Admin_Variant;
          expect(variant.available).toBe(0);
          expect(variant.color_am).toBe("color_am_edited");
          expect(variant.color_ru).toBe("color_ru_edited");
          expect(variant.description_am).toBe("description_am_edited");
          expect(variant.description_ru).toBe("description_ru_edited");
          expect(variant.min_order_unit).toBe("roll");
          expect(variant.min_order_value).toBe(3);
          expect(variant.size_unit).toBe("cm");
          expect(variant.size_value).toBe(3);
          expect(variant.price).toBe(300);
          expect(variant.promo).toBe(150);
          expect(variant.special_group).toBe("liq");
          expect(variant.src).toEqual([valid_photo_src]);
        }
      });
      test("editing variant with authorized user, invalid variant color types", async () => {
        for (const item of items) {
          for (const color of ["color_am", "color_ru"]) {
            for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    {
                      ...item.variants[0],
                      [color]: value
                    }
                  ]
                });
              server.close();
              const value_json = JSON.parse(JSON.stringify({ key: value })).key;
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`typeof ${color} is ${typeof value_json}`);
            }
          }
        }
      });
      test("editing variant with authorized user, empty and only spaces variant color", async () => {
        for (const item of items) {
          for (const color of ["color_am", "color_ru"]) {
            for (const value of ["", "  "]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    {
                      ...item.variants[0],
                      [color]: value
                    }
                  ]
                });
              server.close();
              const lang = color === "color_am" ? "հայերեն" : "ռուսերեն";
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`Գույնի ${lang} անվանումը նշված չէ`);
            }
          }
        }
      });
      test("editing variant with authorized user, invalid variant description types", async () => {
        for (const item of items) {
          for (const description of ["description_am", "description_ru"]) {
            for (const value of [-1, 0, 1, undefined, false, true, {}, [], () => {}]) {
              const res = await request(app)
                .put(`${BASE_URL}/items/item/admin/${item.id}`)
                .set("Cookie", [`jwt_token=${jwt_token}`])
                .send({
                  ...item,
                  variants: [
                    {
                      ...item.variants[0],
                      [description]: value
                    }
                  ]
                });
              server.close();
              const value_json = JSON.parse(JSON.stringify({ key: value })).key;
              expect(res.status).toBe(400);
              expect(res.body.message).toBe(`typeof ${description} is ${typeof value_json}`);
            }
          }
        }
      });
      test("editing variant with authorized user, invalid variant min order value types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "1", NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    min_order_value: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof min_order_value is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant min order value values", async () => {
        for (const item of items) {
          for (const value of [-1, 0]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    min_order_value: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք");
          }
        }
      });
      test("editing variant with authorized user, invalid variant min order unit types", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    min_order_unit: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof min_order_unit is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant min order unit values", async () => {
        for (const item of items) {
          for (const value of ["mm", "", " ", "num"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    min_order_unit: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`invalid min_order_unit: ${value}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant price types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "1", NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    price: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof price is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant price values", async () => {
        for (const item of items) {
          for (const value of [-1, 0]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    price: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Գինը պետք է լինի 0-ից մեծ արժեք");
          }
        }
      });
      test("editing variant with authorized user, invalid variant promo types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "1", undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    promo: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof promo is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, variant promo -1", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  promo: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Ակցիան պետք է լինի 0 կամ 0-ից մեծ արժեք");
        }
      });
      test("editing variant with authorized user, invalid variant size value types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "1", NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    size_value: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof size_value is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant size value values", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  size_value: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Չափի արժեքը պետք է լինի 0 և մեծ արժեք");
        }
      });
      test("editing variant with authorized user, invalid variant size unit types", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    size_unit: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof size_unit is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant size unit values", async () => {
        for (const item of items) {
          for (const value of ["box", "", " ", "roll"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    size_unit: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`invalid size_unit: ${value}`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant special groups", async () => {
        for (const item of items) {
          for (const value of ["", " ", "pr", -1, 0, 1, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    special_group: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Wrong special group");
          }
        }
      });
      test("editing variant with authorized user, invalid variant available types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "1", NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    available: value
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof available is ${typeof value_json}`);
          }
        }
      });
      test("editing variant with authorized user, variant available value -1", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  available: -1
                }
              ]
            });
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe("Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք");
        }
      });
      test("editing variant with authorized user, invalid variant photo src types", async () => {
        for (const item of items) {
          for (const value of ["", " ", "[]", -1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    src: value
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Լուսանկարը բացակայում է");
          }
        }
      });
      test("editing variant with authorized user, invalid variant photo src element types", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    src: [value]
                  }
                ]
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify([value]))[0];
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof photo_src is ${typeof value_json}; index = 0`);
          }
        }
      });
      test("editing variant with authorized user, invalid variant photo src element values", async () => {
        for (const item of items) {
          for (const value of ["", " ", "abcdefghijklmnopqrstuvwxyz", "data:image/abc"]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  {
                    ...item.variants[0],
                    src: [value]
                  }
                ]
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Wrong photo data; index = 0");
          }
        }
      });
      test("editing variant with unauthorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  price: 400
                }
              ]
            });
          server.close();
          expect(res.status).toBe(401);
        }
      });
      test("editing variant with invalid jwt, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", ["jwt_token=invalid_token"])
            .send({
              ...item,
              variants: [
                {
                  ...item.variants[0],
                  price: 400
                }
              ]
            });
          server.close();
          expect(res.status).toBe(403);
        }
      });
    });
    describe("Delete variant tests", () => {
      beforeEach(async () => {
        let index = 0;
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                ...item.variants,
                valid_variant
              ]
            });
          server.close();
          expect(res.status).toBe(200);
          expect(res.body.item.variants).toHaveLength(2);
          items[index++] = res.body.item;
        }
      });
      
      test("deleting variant with authorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true 
                }
              ]              
            });
          expect(res.status).toBe(200);
          expect(res.body.item.variants).toHaveLength(1);
        }
      });
      test("deleting variant with authorized user, wrong types photo_id", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    photo_id: value
                  }
                ]              
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof photo_id is ${typeof value_json}`);
          }
        }
      });
      test("deleting variant with authorized user, empty or spaces only photo_id", async () => {
        for (const item of items) {
          for (const value of ["", "  "]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    photo_id: value
                  }
                ]              
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("photo_id not provided");
          }
        }
      });
      test("deleting variant with authorized user, invalid photo_id", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true,
                  photo_id: "invalid_id"
                }
              ]              
            });
          server.close();
          expect(res.status).toBe(500);
          expect(res.body.message).toBe("Item editing error");
        }
      });
      test("deleting variant with authorized user, wrong types size_id", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    size_id: value
                  }
                ]              
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof size_id is ${typeof value_json}`);
          }
        }
      });
      test("deleting variant with authorized user, empty or spaces only size_id", async () => {
        for (const item of items) {
          for (const value of ["", "  "]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    size_id: value
                  }
                ]              
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("size_id not provided");
          }
        }
      });
      test("deleting variant with authorized user, invalid size_id", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true,
                  size_id: "invalid_id"
                }
              ]              
            });
          server.close();
          expect(res.status).toBe(500);
          expect(res.body.message).toBe("Item editing error");
        }
      });
      test("deleting variant with authorized user, wrong types color_id", async () => {
        for (const item of items) {
          for (const value of [-1, 0, 1, NaN, null, undefined, false, true, {}, [], () => {}]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    color_id: value
                  }
                ]              
              });
            server.close();
            const value_json = JSON.parse(JSON.stringify({ key: value })).key;
            expect(res.status).toBe(400);
            expect(res.body.message).toBe(`typeof color_id is ${typeof value_json}`);
          }
        }
      });
      test("deleting variant with authorized user, empty or spaces only color_id", async () => {
        for (const item of items) {
          for (const value of ["", "  "]) {
            const res = await request(app)
              .put(`${BASE_URL}/items/item/admin/${item.id}`)
              .set("Cookie", [`jwt_token=${jwt_token}`])
              .send({
                ...item,
                variants: [
                  item.variants[0],
                  {
                    ...item.variants[1],
                    delete: true,
                    color_id: value
                  }
                ]              
              });
            server.close();
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("color_id not provided");
          }
        }
      });
      test("deleting variant with authorized user, invalid color_id", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", [`jwt_token=${jwt_token}`])
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true,
                  color_id: "invalid_id"
                }
              ]              
            });
          server.close();
          expect(res.status).toBe(500);
          expect(res.body.message).toBe("Item editing error");
        }
      });
      test("deleting variant with unauthorized user, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true 
                }
              ]              
            });
          expect(res.status).toBe(401);
        }
      });
      test("deleting variant with invalid jwt, valid data", async () => {
        for (const item of items) {
          const res = await request(app)
            .put(`${BASE_URL}/items/item/admin/${item.id}`)
            .set("Cookie", ["jwt_token=invalid_token"])
            .send({
              ...item,
              variants: [
                item.variants[0],
                {
                  ...item.variants[1],
                  delete: true 
                }
              ]              
            });
          expect(res.status).toBe(403);
        }
      });
    });
  });
  describe("Delete Item tests", () => {
    test("deleting item with authorized user, valid id", async () => {
      for (const id of item_id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/items/item/admin/${id}`)
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(200);
      }
      const res = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am`);
      expect(res.status).toBe(200);
      expect(res.body.items_count).toBe(0);
    });
    test("deleting item with authorized user, invalid id", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/items/item/admin/invalid_id`)
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Item deleting error");
    });
    test("deleting item with authorized user, not_existing id", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/items/item/admin/${not_existing_id}`)
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      server.close();
      expect(res.status).toBe(200);
      const res_get = await request(app)
        .get(`${BASE_URL}/items/public/all?lang=am`);
      expect(res_get.status).toBe(200);
      expect(res_get.body.items_count).toBe(4);
    });
    test("deleting item with not authorized user, valid id", async () => {
      for (const id of item_id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/items/item/admin/${id}`)
        server.close();
        expect(res.status).toBe(401);
      }
    });
    test("deleting item with expired jwt token, valid id", async () => {
      for (const id of item_id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/items/item/admin/${id}`)
          .set("Cookie", ["jwt_token=expired_token"]);
        server.close();
        expect(res.status).toBe(403);
      }
    });
  });
});