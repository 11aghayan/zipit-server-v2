import Db from "../../src/db/category-methods";
import item_methods from "../../src/db/item-methods";
import { Db_Error_Response } from "../../src/db/responses";

describe("Get Admin Categories tests", () => {
  beforeAll(async () => { 
    // Adding two categories ['category_am_1', 'category_ru_1'] and ['category_am_2', 'category_ru_2']
    await Db.populate_category_tbl(); 
  });
  afterAll(async () => { await Db.clear_category_tbl() });

  test("checking properties", async () => {
    const result = await Db.get_categories_admin();
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    };
    result.rows
      .forEach((category, i) => {
        expect(typeof category?.id).toBe("string");
        expect(category?.item_count).toBe(0);
        expect(category?.label_am).toBe(`category_am_${i + 1}`);
        expect(category?.label_ru).toBe(`category_ru_${i + 1}`);
      });
  });
});

describe("Get Public Categories tests", () => {
  beforeAll(async () => { 
    // Adding two categories ['category_am_1', 'category_ru_1'] and ['category_am_2', 'category_ru_2']
    await Db.populate_category_tbl(); 
  });
  afterAll(async () => { await Db.clear_category_tbl() });

  test("checking properties for lang = 'am'", async () => {
    const result = await Db.get_categories_public("am");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    };
    result.rows
      .forEach((category, i) => {
        expect(typeof category?.id).toBe("string");
        expect(category?.item_count).toBe(0);
        expect(category?.label).toBe(`category_am_${i + 1}`);
      });
  });
  test("checking properties for lang = 'ru'", async () => {
    const result = await Db.get_categories_public("ru");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    };
    result.rows
      .forEach((category, i) => {
        expect(typeof category?.id).toBe("string");
        expect(category?.item_count).toBe(0);
        expect(category?.label).toBe(`category_ru_${i + 1}`);
      });
  });
});

describe("Add Category tests", () => {
  afterAll(async () => { await Db.clear_category_tbl() });

  test("checking for the result not to be error", async () => {
    const category_label_list = [
      ["category_am_1", "category_ru_1"],
      ["category_am_2", "category_ru_2"]
    ];
    for (const label of category_label_list) {
      const result = await Db.add_category(label[0], label[1]);
      expect(result).toBeUndefined();
    }
  });
});

describe("Edit Category tests", () => {
  let category_id_list: string[] = [];
  beforeAll(async () => {
    const id_list = await Db.populate_category_tbl() as {id: string}[];
    category_id_list = id_list.map(obj => obj.id);
  });
  afterAll(async () => { await Db.clear_category_tbl() });

  test("checking for the result not to be error", async () => {
    const category_label_list = [
      ["category_am_1_modified", "category_ru_1_modified"],
      ["category_am_2_modified", "category_ru_2_modified"]
    ];
    let index = 0;
    for (const id of category_id_list) {
      const labels = category_label_list[index++];
      const result = await Db.edit_category(id, labels[0], labels[1]);
      expect(result).toBeUndefined();
    }
  });
});

describe("Delete Category", () => {
  let category_id_list: string[] = [];
  beforeEach(async () => {
    const id_list = await Db.populate_category_tbl() as {id: string}[];
    category_id_list = id_list.map(obj => obj.id);
  });
  afterEach(async () => { await Db.clear_category_tbl() });

  test("checking for an empty category deletion", async () => {
    for (const id of category_id_list) {
      const result = await Db.delete_category(id);
      expect(result).toBeUndefined();
    }
  });
  test("checking for a non empty category deletion", async () => {
    await item_methods.populate_item_tbl(category_id_list);
    for (const id of category_id_list) {
      const result = await Db.delete_category(id);
      expect(result).toBe("Կատեգորիան ջնջելու համար այն պետք է չպարունակի որևէ ապրանք");
    }
  });
});