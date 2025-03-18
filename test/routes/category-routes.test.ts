import request from "supertest";
import db from "../../src/db/category-methods";
import db_auth from "../../src/db/auth-methods";
import db_items from "../../src/db/item-methods";
import { app, BASE_URL, server } from "../../src";
import { get_jwt_token } from "../test-util";
import { T_ID } from "../../src/types";

const lang_list = ["am", "ru"] as const;
let id_list: T_ID[];

beforeEach(async () => {
  await db_auth.populate_user_tbl();
  const res = await db.populate_category_tbl() as { id: string }[];
  id_list = res.map(c => c.id);
});
afterEach(async () => {
  await db.clear_category_tbl();
  await db_auth.clear_user_tbl();
  server.close();
});

describe("Admin tests", () => {
  let jwt_token: string;

  beforeEach(async () => {
    const res = await request(app)
      .post(`${BASE_URL}/auth/login`)
      .send({ username: "test_username", password: "test_password" });
    jwt_token = get_jwt_token(res);
  });
  
  describe("Get All Categories tests", () => {
    test("getting categories with an authorized user", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/categories/admin`)
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      for (const category of res.body.categories) {
        expect(typeof category.id).toBe("string");
        expect(typeof category.label_am).toBe("string");
        expect(typeof category.label_ru).toBe("string");
        expect(typeof category.item_count).toBe("number");
      }
    });
    test("getting categories with a not authorized user", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/categories/admin`);
      expect(res.status).toBe(401);
    });
    test("getting categories with an invalid jwt_token", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/categories/admin`)
        .set("Cookie", ["jwt_token=invalid_token"]);
      expect(res.status).toBe(403);
    });
  });

  describe("Add Category tests", () => {
    test("adding category with authorized user and valid category labels", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "category_am_test", label_ru: "category_ru_test" })
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(201);
    });
    test("adding category with authorized user and omitting am category label", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "", label_ru: "category_ru_test" })
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Կատեգորիայի հայերեն անվանումը նշված չէ");
    });
    test("adding category with authorized user and omitting ru category label", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "category_am_test", label_ru: "" })
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Կատեգորիայի ռուսերեն անվանումը նշված չէ");
    });
    test("adding category with authorized user and spaces only am category label", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "   ", label_ru: "category_ru_test" })
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Կատեգորիայի հայերեն անվանումը նշված չէ");
    });
    test("adding category with authorized user and spaces only ru category label", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "category_am_test", label_ru: "   " })
        .set("Cookie", [`jwt_token=${jwt_token}`]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Կատեգորիայի ռուսերեն անվանումը նշված չէ");
    });
    test("adding category with authorized user and am category label of wrong types", async () => {
      const wrong_type_labels = [0, 1, false, true, undefined, null, NaN, {}, [], () => {}];
      for (const label of wrong_type_labels) {
        const label_json = JSON.parse(JSON.stringify({ key: label })).key;
        const res = await request(app)
          .post(`${BASE_URL}/categories`)
          .send({ label_am: label, label_ru: "category_ru_test" })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof label_am is ${typeof label_json}`);
      }
    });
    test("adding category with authorized user and ru category label of wrong types", async () => {
      const wrong_type_labels = [0, 1, false, true, undefined, null, NaN, {}, [], () => {}];
      for (const label of wrong_type_labels) {
        const label_json = JSON.parse(JSON.stringify({ key: label })).key;
        const res = await request(app)
          .post(`${BASE_URL}/categories`)
          .send({ label_am: "category_am_test", label_ru: label })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(`typeof label_ru is ${typeof label_json}`);
      }
    });
    test("adding category with unauthorized user", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "category_am_test", label_ru: "category_ru_test" });
      expect(res.status).toBe(401);
    });
    test("adding category with invalid jwt_token", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/categories`)
        .send({ label_am: "category_am_test", label_ru: "category_ru_test" })
        .set("Cookie", ["jwt_token=invalid_jwt_token"]);
      expect(res.status).toBe(403);
    });
  });

  describe("Edit Category tests", () => {
    test("editing category with valid label_am and label_ru", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "changed_category_label_am", label_ru: "changed_category_label_ru" })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(200);
      }
    });
    test("editing category with authorized user and omitting am category label", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "", label_ru: "category_ru_test" })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Կատեգորիայի հայերեն անվանումը նշված չէ");
      }
    });
    test("editing category with authorized user and omitting ru category label", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "category_am_test", label_ru: "" })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Կատեգորիայի ռուսերեն անվանումը նշված չէ");

      }
    });
    test("editing category with authorized user and spaces only am category label", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "   ", label_ru: "category_ru_test" })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Կատեգորիայի հայերեն անվանումը նշված չէ");
      }
    });
    test("editing category with authorized user and spaces only ru category label", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "category_am_test", label_ru: "   " })
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Կատեգորիայի ռուսերեն անվանումը նշված չէ");
      }
    });
    test("editing category with authorized user and am category label of wrong types", async () => {
      const wrong_type_labels = [0, 1, false, true, undefined, null, NaN, {}, [], () => {}];
      for (const id of id_list) {
        for (const label of wrong_type_labels) {
          const label_json = JSON.parse(JSON.stringify({ key: label })).key;
          const res = await request(app)
            .put(`${BASE_URL}/categories/${id}`)
            .send({ label_am: label, label_ru: "category_ru_test" })
            .set("Cookie", [`jwt_token=${jwt_token}`]);
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe(`typeof label_am is ${typeof label_json}`);
        }
      }
    });
    test("editing category with authorized user and ru category label of wrong types", async () => {
      const wrong_type_labels = [0, 1, false, true, undefined, null, NaN, {}, [], () => {}];
      for (const id of id_list) {
        for (const label of wrong_type_labels) {
          const label_json = JSON.parse(JSON.stringify({ key: label })).key;
          const res = await request(app)
            .put(`${BASE_URL}/categories/${id}`)
            .send({ label_am: "category_am_test", label_ru: label })
            .set("Cookie", [`jwt_token=${jwt_token}`]);
          server.close();
          expect(res.status).toBe(400);
          expect(res.body.message).toBe(`typeof label_ru is ${typeof label_json}`);
        }
      }
    });
    test("editing category with unauthorized user", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "category_am_test", label_ru: "category_ru_test" });
        server.close();
        expect(res.status).toBe(401);
      }
    });
    test("editing category with invalid jwt_token", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .put(`${BASE_URL}/categories/${id}`)
          .send({ label_am: "category_am_test", label_ru: "category_ru_test" })
          .set("Cookie", ["jwt_token=invalid_jwt_token"]);
        server.close();
        expect(res.status).toBe(403);
      }
    });
  });

  describe("Delete Category tests", () => {
    test("delete an empty category with authorized user", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/categories/${id}`)
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close(); 
        expect(res.status).toBe(200);
      }
    });
    test("delete a non empty category with authorized user", async () => {
      await db_items.populate_item_tbl(id_list);
      for (const id of id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/categories/${id}`)
          .set("Cookie", [`jwt_token=${jwt_token}`]);
        server.close(); 
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Կատեգորիան ջնջելու համար այն պետք է չպարունակի որևէ ապրանք");
      }
    });
    test("delete an empty category with non authorized user", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/categories/${id}`);
        server.close(); 
        expect(res.status).toBe(401);
      }
    });
    test("delete an empty category with invalid jwt token", async () => {
      for (const id of id_list) {
        const res = await request(app)
          .delete(`${BASE_URL}/categories/${id}`)
          .set("Cookie", ["jwt_token=invalid_token"]);
        server.close(); 
        expect(res.status).toBe(403);
      }
    });
  });
});

describe("Public tests", () => {
  test("getting categories with provided, valid lang", async () => {
    for (const lang of lang_list) {
      const res = await request(app)
        .get(`${BASE_URL}/categories/public?lang=${lang}`);
      server.close();
      expect(res.status).toBe(200);
    }
  });
  test("getting categories with provided, invalid lang", async () => {
    for (const lang of ["en, es, it", "de", "arm", "rus"]) {
      const res = await request(app)
        .get(`${BASE_URL}/categories/public?lang=${lang}`);
      server.close();
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(`lang must be either am or ru, you provided ${lang}`);
    }
  });
  test("getting categories with not provided lang", async () => {
    const res = await request(app)
        .get(`${BASE_URL}/categories/public`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("lang must be either am or ru, you provided undefined");
  });
});