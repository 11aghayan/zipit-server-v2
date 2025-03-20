import db from "../../src/db/item-methods";
import db_category from "../../src/db/category-methods";
import db_auth from "../../src/db/auth-methods";
import request from "supertest";
import { server, app, BASE_URL } from "../../src";
import { Db_Error_Response, Db_Success_Response } from "../../src/db/responses";
import { T_ID, T_Item_Admin_Full } from "../../src/types";

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
  test.todo("Implement All");
});