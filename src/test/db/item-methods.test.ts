// Populated categories {label_am: 'category_am_1', label_ru: 'category_ru_1'} and {label_am: 'category_am_2', label_ru: 'category_ru_2'}

// Populated items { 
  //   category_id: category_id,  
  //   name_am: 'name_am_index',
  //   name_ru: 'name_ru_index',
  //   variants: [
  //     {
  //       available: 1,
  //       color_am: 'color_am_index',
  //       color_ru: 'color_ru_index',
  //       description_am: 'description_am_index',
  //       description_ru: 'description_ru_index',
  //       min_order_unit: 'box',
  //       min_order_value: index,
  //       price: 100 * index,
  //       promo: null || 50 * index,
  //       size_unit: 'num',
  //       size_value: index,
  //       special_group: 'prm' & null,
  //       src: [valid_photo_src, valid_photo_src]
  //     }
  //   ]
  // }

import category_methods from "../../db/category-methods";
import Db from "../../db/item-methods";
import { Db_Error_Response } from "../../db/responses";
import { T_ID, T_Item_Admin_Full, T_Item_Body, T_Item_Body_Edit, T_Item_Body_Variant_Edit } from "../../types";
import { valid_photo_src } from "../test-util";

const lang_list = ["am", "ru"] as const;
const wrong_id = "0a773263-ddaf-4c44-b5f0-8de15f81599f";
let item_id_list: T_ID[] = [];
let category_id_list: T_ID[] = [];

beforeEach(async () => {
  const result = await category_methods.populate_category_tbl() as { id: string }[];
  category_id_list = result.map(c => c.id);
  const id_list = await Db.populate_item_tbl(category_id_list) as string[];
  item_id_list = id_list;
});
afterEach(async () => {
  await Db.clear_item_tbl();
  await category_methods.clear_category_tbl();
});

describe("Get All Public Items tests", () => {
  test("checking items with offset 0", async () => {
    for (const lang of lang_list) {
      const items = await Db.get_all_items_public({ categories: null, count: 10, offset: 0, search: null, special_groups: null }, `name_${lang} asc`, lang);
      if (items instanceof Db_Error_Response) {
        expect(items).toBe(1);
        return;
      }
      expect(items?.error).toBe(false);
      expect(items?.rows).toHaveLength(4);
      let index = 1;
      for (const item of items.rows) {
        expect(typeof item?.id).toBe("string");
        expect(typeof item?.photo_id).toBe("string");
        expect(item?.color).toBe(`color_${lang}_${index}`);
        expect(item?.name).toBe(`name_${lang}_${index}`);
        expect(item?.count).toBe(4);
        expect(item?.min_order_unit).toBe("box");
        expect(item?.min_order_value).toBe(index);
        expect(item?.price).toBe(index * 100);
        expect(item?.promo).toBe(index === 1 ? null : index * 50);
        expect(item?.size_unit).toBe("num");
        expect(item?.size_value).toBe(index);
        expect(item?.special_group).toBe(index === 1 ? "prm" : null);
        index++;
      }
    } 
  });
  test("checking items with offset 10", async () => {
    for (const lang of lang_list) {
      const items = await Db.get_all_items_public({ categories: null, count: 10, offset: 10, search: null, special_groups: null }, `name_${lang} asc`, lang);
      if (items instanceof Db_Error_Response) {
        expect(items).toBe(1);
        return;
      }
      expect(items).toHaveProperty("rows");
      expect(items.rows).toEqual([]);
    } 
  });
  test("checking with non existing category_ids", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_all_items_public({ categories: [wrong_id], count: 10, offset: 0, search: null, special_groups: null }, `name_${lang} asc`, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(0);
    }
  });
  test("checking with search text '%name_am_2%'", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_all_items_public({ categories: null, count: 10, offset: 0, search: "%name_am_2%", special_groups: null }, `name_${lang} asc`, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(1);
      const item = result.rows[0];
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(item?.name).toBe(`name_${lang}_2`);
      expect(item?.count).toBe(1);
    }
  });
  test("checking with search text '%name_am_11%'", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_all_items_public({ categories: null, count: 10, offset: 0, search: "%name_am_11%", special_groups: null }, `name_${lang} asc`, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(0);
    }
  });
  test("checking with search text '%nam%'", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_all_items_public({ categories: null, count: 10, offset: 0, search: "%nam%", special_groups: null }, `name_${lang} asc`, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(4);
      const items = result.rows;
      items.sort((a,b) => a.name > b.name ? 1 : -1);
      let index = 1;
      for (const item of items) {
        expect(typeof item?.id).toBe("string");
        expect(typeof item?.photo_id).toBe("string");
        expect(item?.name).toBe(`name_${lang}_${index}`);
        expect(item?.count).toBe(4);
        index++;
      }
    }
  });
  test("checking with special group 'prm'", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_all_items_public({ categories: null, count: 10, offset: 0, search: null, special_groups: ["prm"] }, `name_${lang} asc`, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(1);
      const item = result.rows[0];
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(item?.count).toBe(1);
      expect(item?.name).toBe(`name_${lang}_1`);
    }
  });
});

describe("Get Public Item tests", () => {
  test("checking for an item with an existing id", async () => {
    for (const lang of lang_list) {
      let index = 1;
      for (const item_id of item_id_list) {
        const result = await Db.get_item_public(item_id, lang);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result?.error).toBe(false);
        expect(result?.rows).toHaveLength(1);
        const item = result.rows[0];
        expect(typeof item?.id).toBe("string");
        expect(typeof item?.color_id).toBe("string");
        expect(typeof item?.category_id).toBe("string");
        expect(typeof item?.photo_id).toBe("string");
        expect(typeof item?.size_id).toBe("string");
        expect(item?.available).toBe(1);
        expect(item?.category).toBe(`category_${lang}_${category_id_list.indexOf(item?.category_id) + 1}`);
        expect(item?.color).toBe(`color_${lang}_${index}`);
        expect(item?.description).toBe(`description_${lang}_${index}`);
        expect(item?.min_order_unit).toBe("box");
        expect(item?.min_order_value).toBe(index);
        expect(item?.name).toBe(`name_${lang}_${index}`);
        expect(item?.photo_count).toBe(2);
        expect(item?.price).toBe(100 * index);
        expect(item?.promo).toBe(index === 1 ? null : index * 50);
        expect(item?.size_unit).toBe("num");
        expect(item?.size_value).toBe(index);
        expect(item?.special_group).toBe(index === 1 ? "prm" : null);
        index++;
      }
    }
  });
  test("checking for an item with a non existing id", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_item_public(wrong_id, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;        
      }
      expect(result?.error).toBe(false);      
      expect(result?.rows).toEqual([]);
    }
  });
  test("checking for an item with wrong types of id", async () => {
    const wrong_id_list = ["wrong-id", "", 1, 0, true, null, NaN, undefined, {}, [], () => {}];
    for (const lang of lang_list) {
      for (const id of wrong_id_list) {
        const result = await Db.get_item_public(id as T_ID, lang);
        expect(result).toBeInstanceOf(Db_Error_Response);
      }
    }
  });
});

describe("Get Similar Items tests", () => {
  test("checking similar items with same category", async () => {
    for (const lang of lang_list) {
      let index = 0;
      for (const category_id of category_id_list) {
        const item_id = item_id_list[index];
        const result = await Db.get_similar_items(item_id, category_id, null, "num", 10, lang);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result?.error).toBe(false);
        expect(result?.rows).toHaveLength(3);
        index++;
      }
    }
  });
});

describe("Get Cart Items tests", () => {
  test("checking cart items with valid item_id and photo_id", async () => {
    const cart_items: { item_id: string, photo_id: string }[] = [];
    for (const id of item_id_list) {
      const res = await Db.get_item_admin(id);
      if (res instanceof Db_Error_Response) {
        expect(res).toBe(1);
        return;
      }
      cart_items.push({ item_id: res.rows[0].id, photo_id: res.rows[0].photo_id });
    }
    for (const lang of lang_list) {
      const result = await Db.get_cart_items(cart_items, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(item_id_list.length);
      let index = 1;
      result.rows.sort((a,b) => a.name > b.name ? 1 : -1);
      for (const item of result.rows) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.photo_id).toBe("string");
        expect(item.color).toBe(`color_${lang}_${index}`);
        expect(item.count).toBe("4");
        expect(item.min_order_unit).toBe("box");
        expect(item.min_order_value).toBe(index);
        expect(item.name).toBe(`name_${lang}_${index}`);
        expect(item.price).toBe(index * 100);
        expect(item.promo).toBe(index === 1 ? null : index * 50);
        expect(item.size_unit).toBe("num");
        expect(item.size_value).toBe(index);
        expect(item.special_group).toBe(index === 1 ? "prm" : null);
        index++;
      }
    }
  });
  test("checking cart items with invalid item_id and photo_id", async () => {
    const cart_items: { item_id: string, photo_id: string }[] = [
      { item_id: wrong_id, photo_id: wrong_id }
    ];
    for (const lang of lang_list) {
      const result = await Db.get_cart_items(cart_items, lang);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(0);
    }
  });
});

describe("Get Items by Photo Ids tests", () => {
  let photo_ids: T_ID[] = [];
  beforeEach(async () => {
    for (const id of item_id_list) {
      const result = await Db.get_item_admin(id);
      if (result instanceof Db_Error_Response || result.rows.length < 1) {
        return;
      }
      const item = result.rows[0];
      photo_ids.push(item?.photo_id);
    }
  });
  afterEach(() => { photo_ids = [] });

  test("checking with valid photo ids", async () => {
    const result = await Db.get_items_by_photo_ids(photo_ids);
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(4);
    const items = result.rows;
    items.sort((a,b) => a.name_am > b.name_am ? 1 : -1);
    let index = 1;
    for (const item of items) {
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.category_id).toBe("string");
      expect(typeof item?.color_id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(typeof item?.size_id).toBe("string");
      expect(typeof item?.creation_date).toBe("number");
      expect(item?.available).toBe(1);
      expect(item?.color_am).toBe(`color_am_${index}`);
      expect(item?.color_ru).toBe(`color_ru_${index}`);
      expect(item?.description_am).toBe(`description_am_${index}`);
      expect(item?.description_ru).toBe(`description_ru_${index}`);
      expect(item?.min_order_unit).toBe("box");
      expect(item?.min_order_value).toBe(index);
      expect(item?.name_am).toBe(`name_am_${index}`);
      expect(item?.name_ru).toBe(`name_ru_${index}`);
      expect(item?.price).toBe(100 * index);
      expect(item?.promo).toBe(index === 1 ? null : 50 * index);
      expect(item?.size_unit).toBe("num");
      expect(item?.size_value).toBe(index);
      expect(item?.special_group).toBe(index === 1 ? "prm" : null);
      index++;
    }
  });
  test("checking with non existing photo ids", async () => {
    const result = await Db.get_items_by_photo_ids([wrong_id]);
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(0);
  });
  test("checking with invalid photo ids", async () => {
    const result = await Db.get_items_by_photo_ids(["", "asdc"]);
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
});

describe("Get All Admin Items tests", () => {
  test("checking with offset 0", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: null, special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(4);
    const items = result.rows;
    items.sort((a,b) => a.name > b.name ? 1 : -1);
    let index = 1;
    for (const item of items) {
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(item?.name).toBe(`name_am_${index}`);
      expect(item?.count).toBe(4);
      index++;
    }
  });
  test("checking with offset 10", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 10, search: null, special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(0);
  });
  test("checking with non existing category_ids", async () => {
    const result = await Db.get_all_items_admin({ categories: [wrong_id], count: 10, offset: 0, search: null, special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(0);
  });
  test("checking with search text '%name_am_2$'", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: "%name_am_2%", special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(1);
    const item = result.rows[0];
    expect(typeof item?.id).toBe("string");
    expect(typeof item?.photo_id).toBe("string");
    expect(item?.name).toBe(`name_am_2`);
    expect(item?.count).toBe(1);
  });
  test("checking with search text '%name_am_11%'", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: "%name_am_11%", special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(0);
  });
  test("checking with search text '%nam%'", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: "%nam%", special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(4);
    const items = result.rows;
    items.sort((a,b) => a.name > b.name ? 1 : -1);
    let index = 1;
    for (const item of items) {
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(item?.name).toBe(`name_am_${index}`);
      expect(item?.count).toBe(4);
      index++;
    }
  });
  test("checking with special group 'prm'", async () => {
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: null, special_groups: ["prm"] }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(1);
    const item = result.rows[0];
    expect(typeof item?.id).toBe("string");
    expect(typeof item?.photo_id).toBe("string");
    expect(item?.count).toBe(1);
    expect(item?.name).toBe("name_am_1");
  });
});

describe("Get Admin Item tests", () => {
  test("checking for an item with an existing id", async () => {
    let index = 1;
    for (const item_id of item_id_list) {
      const result = await Db.get_item_admin(item_id);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result?.error).toBe(false);
      expect(result?.rows).toHaveLength(1);
      const item = result.rows[0];
      expect(typeof item?.id).toBe("string");
      expect(typeof item?.color_id).toBe("string");
      expect(typeof item?.category_id).toBe("string");
      expect(typeof item?.photo_id).toBe("string");
      expect(typeof item?.size_id).toBe("string");
      expect(typeof item?.creation_date).toBe("number");
      expect(item?.available).toBe(1);
      expect(item?.color_am).toBe(`color_am_${index}`);
      expect(item?.color_ru).toBe(`color_ru_${index}`);
      expect(item?.description_am).toBe(`description_am_${index}`);
      expect(item?.description_ru).toBe(`description_ru_${index}`);
      expect(item?.min_order_unit).toBe("box");
      expect(item?.min_order_value).toBe(index);
      expect(item?.name_am).toBe(`name_am_${index}`);
      expect(item?.name_ru).toBe(`name_ru_${index}`);
      expect(item?.price).toBe(100 * index);
      expect(item?.promo).toBe(index === 1 ? null : index * 50);
      expect(item?.size_unit).toBe("num");
      expect(item?.size_value).toBe(index);
      expect(item?.special_group).toBe(index === 1 ? "prm" : null);
      expect(item?.src).toHaveLength(2);
      for (let i = 1; i <= 2; i++) {
        expect(item?.src[i - 1]).toBe(valid_photo_src);
      }
      index++;
    }
  });
  test("checking for an item with a non existing id", async () => {
    const result = await Db.get_item_admin(wrong_id);
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;        
    }
    expect(result?.error).toBe(false);      
    expect(result?.rows).toEqual([]);
  });
  test("checking for an item with wrong types of id", async () => {
    const wrong_id_list = ["wrong-id", "", 1, 0, true, null, NaN, undefined, {}, [], () => {}];
    for (const id of wrong_id_list) {
      const result = await Db.get_item_admin(id as T_ID);
      expect(result).toBeInstanceOf(Db_Error_Response);
    }
  });
});

describe("Add Item tests", () => {
  let valid_item: T_Item_Body;
  
  beforeEach(async () => {
    await Db.clear_item_tbl();
    valid_item = {
      category_id: category_id_list[0],
      name_am: "name_am_1",
      name_ru: "name_ru_1",
      variants: [
        {
          available: 1,
          color_am: "color_am_1",
          color_ru: "color_ru_1",
          description_am: "description_am_1",
          description_ru: "description_ru_1",
          price: 100,
          promo: 30,
          min_order_unit: "roll",
          min_order_value: 3,
          size_unit: "cm",
          size_value: 2,
          special_group: "liq",
          src: [valid_photo_src, valid_photo_src]
        }
      ]
    } as T_Item_Body;
  });

  test("adding an item with valid properties", async () => {
    const result = await Db.add_item(valid_item);
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result?.error).toBe(false);
    expect(result?.rows).toHaveLength(1);
    expect(typeof result?.rows[0]).toBe("string");
  });
  test("adding an item with missing name", async () => {
    const result = await Db.add_item({
      ...valid_item,
      name_am: "",
      name_ru: "name_ru_1"
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with invalid category id", async () => {
    const result = await Db.add_item({
      ...valid_item,
      category_id: wrong_id
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with no variants", async () => {
    const result = await Db.add_item({ ...valid_item, variants: [] });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with missing color", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          color_am: "color_am_1",
          color_ru: ""
        }
      ]
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with missing size value", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          //@ts-ignore
          size_value: undefined
        }
      ]
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with missing min order value", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          //@ts-ignore
          min_order_value: undefined
        }
      ]
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with invalid min order unit", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          //@ts-ignore
          min_order_unit: "mm"
        }
      ]
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with missing available", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          //@ts-ignore
          available: undefined
        }
      ]
    });
    expect(result).toBeInstanceOf(Db_Error_Response);
  });
  test("adding an item with no photos", async () => {
    const result = await Db.add_item({
      ...valid_item,
      variants: [
        {
          ...valid_item.variants[0],
          src: []
        }
      ]
    })

    expect(result).toBeInstanceOf(Db_Error_Response);
  });
});

describe("Edit Item tests", () => {
  afterEach(async () => {
    await Db.clear_item_tbl();
  })
  
  test("deleting the variant", async () => {
    for (const item_id of item_id_list) {
      const get_response = await Db.get_item_admin(item_id);
      if (get_response instanceof Db_Error_Response) {
        expect(get_response).toBe(1);
        return;
      }
      const item_raw = create_item_edit(get_response.rows[0]);
      const item = { ...item_raw, variants: [{ ...item_raw.variants[0], delete: true }] };
      const edit_response = await Db.edit_item(item);
      expect(edit_response).toBeUndefined();
      const item_response = await Db.get_item_admin(item_id);
      if (item_response instanceof Db_Error_Response) {
        expect(item_response).toBe(1);
        return;
      }
      expect(item_response.rows[0].photo_id).toBeNull();
      expect(item_response.rows[0].src).toBeNull();
    }
  });
  describe("changing properties in the item variant", () => {
    let items: (T_Item_Body_Edit & { id: string })[];
    beforeEach(async () => {
      items = [];
      for (const item_id of item_id_list) {
        const result = await Db.get_item_admin(item_id);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        const item = create_item_edit(result.rows[0]);
        items.push(item);
      }
    });
    
    test("changing name", async () => {
      let index = 1;
      for (const item of items) {
        item.name_am = item.name_am + "_edited"; 
        item.name_ru = item.name_ru + "_edited";  
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].name_am).toBe(`name_am_${index}_edited`);
        expect(res.rows[0].name_ru).toBe(`name_ru_${index}_edited`);
        index++;
      }
    });
    test("changing availability", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].available = 0;
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].available).toBe(0);
      }
    });
    test("changing color", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].color_am = item.variants[0].color_am + "_edited"; 
        item.variants[0].color_ru = item.variants[0].color_ru + "_edited"; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].color_am).toBe(`color_am_${index}_edited`);
        expect(res.rows[0].color_ru).toBe(`color_ru_${index}_edited`);
        index++;
      }
    });
    test("changing description to value", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].description_am = item.variants[0].description_am + "_edited"; 
        item.variants[0].description_ru = item.variants[0].description_ru + "_edited"; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].description_am).toBe(`description_am_${index}_edited`);
        expect(res.rows[0].description_ru).toBe(`description_ru_${index}_edited`);
        index++;
      }
    });
    test("changing description to null", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].description_am = null; 
        item.variants[0].description_ru = null; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].description_am).toBe(null);
        expect(res.rows[0].description_ru).toBe(null);
      }
    });
    test("changing min order", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].min_order_unit = "pcs"; 
        item.variants[0].min_order_value = item.variants[0].min_order_value + 5; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].min_order_unit).toBe("pcs");
        expect(res.rows[0].min_order_value).toBe(index + 5);
        index++;
      }
    });
    test("changing price", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].price = item.variants[0].price + 5; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].price).toBe(index * 100 + 5);
        index++;
      }
    });
    test("changing promo to value", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].promo = (item.variants[0].promo ?? 0) + 5; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].promo).toBe(index === 1 ? 5 : index * 50 + 5);
        index++;
      }
    });
    test("changing promo to null", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].promo = null; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].promo).toBe(null);
      }
    });
    test("changing size", async () => {
      let index = 1;
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].size_unit = "mm"; 
        item.variants[0].size_value = item.variants[0].size_value + 5; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].size_unit).toBe("mm");
        expect(res.rows[0].size_value).toBe(index + 5);
        index++;
      }
    });
    test("changing special group to value", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].special_group = "new"; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].special_group).toBe("new");
      }
    });
    test("changing special group to null", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        item.variants[0].special_group = null; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].special_group).toBe(null);
      }
    });
    test("changing photo_src[0]", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        const [photo_1, photo_2] = item.variants[0].src;
        item.variants[0].src = [`${photo_1}_edited`, photo_2]; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].src).toEqual([`${valid_photo_src}_edited`, valid_photo_src]);
      }
    });
    test("removing photo_src[1]", async () => {
      for (const it of items) {
        const item = it as T_Item_Body_Edit & {
          id: string,
          variants: T_Item_Body_Variant_Edit[]
        }
        const [photo_1] = item.variants[0].src;
        item.variants[0].src = [photo_1]; 
        const result = await Db.edit_item(item);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result).toBeUndefined();
        const res = await Db.get_item_admin(item.id);
        if (res instanceof Db_Error_Response) {
          expect(res).toBe(1);
          return;
        }
        expect(res.rows[0].src).toEqual([valid_photo_src]);
      }
    });
  });
  test("adding a variant", async () => {
    for (const item_id of item_id_list) {
      const get_item_result = await Db.get_item_admin(item_id);
      if (get_item_result instanceof Db_Error_Response) {
        expect(get_item_result).toBe(1);
        return;
      }
      const item = create_item_edit(get_item_result.rows[0]);
      const starting_index = Number(item.name_am.split("_")[2]);
      for (let index = starting_index + 1; index < starting_index + 3; index++) {
        const result = await Db.edit_item({
          ...item,
          variants: [
            ...item.variants,
            {
              available: 1,
              color_am: `color_am_${index}`,
              color_ru: `color_ru_${index}`,
              description_am: `description_am_${index}`,
              description_ru: `description_ru_${index}`,
              min_order_unit: "box",
              min_order_value: index,
              price: index * 100,
              promo: index * 50,
              size_unit: "num",
              size_value: index,
              special_group: "prm",
              src: [valid_photo_src, valid_photo_src]
            }
          ]
        });
        expect(result).toBe(undefined);
        {
          const result = await Db.get_item_admin(item_id);
          if (result instanceof Db_Error_Response) {
            expect(result).toBe(1);
            return;
          }
          expect(result.rows).toHaveLength(index === starting_index + 1 ? 2 : 3);
          let i = starting_index;
          result.rows.sort((a, b) => a.color_am > b.color_am ? 1 : -1);
          for (const variant of result.rows) {
            expect(variant.color_am).toBe(`color_am_${i}`);
            expect(variant.color_ru).toBe(`color_ru_${i}`);
            expect(variant.description_am).toBe(`description_am_${i}`);
            expect(variant.description_ru).toBe(`description_ru_${i}`);
            expect(variant.min_order_value).toBe(i);
            expect(variant.size_value).toBe(i);
            expect(variant.price).toBe(i * 100);
            i++;
          }
        }
      }
    }
  });
  describe("editing the variant with invalid props", () => {
    let items: (T_Item_Body_Edit & { id: string })[];
    beforeEach(async () => {
      items = [];
      for (const item_id of item_id_list) {
        const result = await Db.get_item_admin(item_id);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        const item = create_item_edit(result.rows[0]);
        items.push(item);
      }
    });
    
    test("changing name", async () => {
      for (const item of items) {
        const wrong_values = ["", 0, 1, null, undefined, true, false, {}, [], () => {}, NaN];
        for (const wrong_name of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            // @ts-ignore
            name_am: wrong_name,
            // @ts-ignore
            name_ru: wrong_name
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing availability", async () => {
      for (const item of items) {
        const wrong_values = ["", null, undefined, true, false, {}, [], () => {}, NaN];
        for (const available of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                available
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing color", async () => {
      for (const item of items) {
        const wrong_values = ["", null, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                color_am: value,
                // @ts-ignore
                color_ru: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing description to value", async () => {
      for (const item of items) {
        const wrong_values = [0, 1, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                description_am: value,
                // @ts-ignore
                description_ru: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing min order unit", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "dm", "inch", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                min_order_unit: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing min order value", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                min_order_value: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing price", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                price: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing promo", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                promo: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing size unit", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "dm", "inch", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                size_unit: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing size value", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                size_value: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing special group", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", 0, 1, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                special_group: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing photo_src to wrong types", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", 0, 1, undefined, true, false, {}, null, () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                src: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("changing photo_src to empty array", async () => {
      for (const item of items) {
        const result = await Db.edit_item({
          ...item,
          variants: [
            {
              ...item.variants[0],
              src: []
            }
          ]
        });
        expect(result).toBeInstanceOf(Db_Error_Response);
      }
    });
    test("changing photo_src to an array containing wrong types", async () => {
      for (const item of items) {
        const wrong_values = ["", [], 0, 1, undefined, true, false, {}, null, () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              {
                ...item.variants[0],
                // @ts-ignore
                src: [value]
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
  });
  describe("adding a variant with invalid props", () => {
    const valid_variant = {
      available: 1,
      color_am: "color_am_tst",
      color_ru: "color_ru_tst",
      description_am: "description_am_tst",
      description_ru: "description_ru_tst",
      min_order_unit: "box",
      min_order_value: 2,
      price: 100,
      promo: null,
      size_unit: "cm",
      size_value: 2,
      special_group: null,
      src: ["photo_src"]
    };
    let items: (T_Item_Body_Edit & { id: string })[];
    beforeEach(async () => {
      items = [];
      for (const item_id of item_id_list) {
        const result = await Db.get_item_admin(item_id);
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        const item = create_item_edit(result.rows[0]);
        items.push(item);
      }
    });
    test("wrong availability", async () => {
      for (const item of items) {
        const wrong_values = ["", null, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                available: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong color", async () => {
      for (const item of items) {
        const wrong_values = ["", null, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                color_am: value,
                color_ru: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong description to value", async () => {
      for (const item of items) {
        const wrong_values = [0, 1, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                description_am: value,
                description_ru: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong min order unit", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "dm", "inch", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                min_order_unit: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong min order value", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                min_order_value: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong price", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                price: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong promo", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                promo: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong size unit", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "dm", "inch", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                size_unit: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong size value", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", undefined, null, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                size_value: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong special group", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", 0, 1, undefined, true, false, {}, [], () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                special_group: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong photo_src to wrong types", async () => {
      for (const item of items) {
        const wrong_values = ["abc", "", 0, 1, undefined, true, false, {}, null, () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                src: value
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
    test("wrong photo_src to empty array", async () => {
      for (const item of items) {
        const result = await Db.edit_item({
          ...item,
          variants: [
            // @ts-ignore
            ...item.variants,
            // @ts-ignore
            {
              ...valid_variant,
              src: []
            }
          ]
        });
        expect(result).toBeInstanceOf(Db_Error_Response);
      }
    });
    test("wrong photo_src to an array containing wrong types", async () => {
      for (const item of items) {
        const wrong_values = ["", [], 0, 1, undefined, true, false, {}, null, () => {}, NaN];
        for (const value of wrong_values) {
          const result = await Db.edit_item({
            ...item,
            variants: [
              // @ts-ignore
              ...item.variants,
              // @ts-ignore
              {
                ...valid_variant,
                src: [value]
              }
            ]
          });
          expect(result).toBeInstanceOf(Db_Error_Response);
        }
      }
    });
  });
});

describe("Delete Item tests", () => {
  test("deleting existing items", async () => {
    for (const item_id of item_id_list) {
      const result = await Db.delete_item(item_id);
      expect(result).toBeUndefined();
    }
    const result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: null, special_groups: null }, "name_am asc");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result.rows).toHaveLength(0);
  });
  test("delete a non existing item(wrong id)", async () => {
    const result = await Db.delete_item(wrong_id);
    expect(result).toBeUndefined();
    const get_result = await Db.get_all_items_admin({ categories: null, count: 10, offset: 0, search: null, special_groups: null }, "name_am asc");
    if (get_result instanceof Db_Error_Response) {
      expect(get_result).toBe(1);
      return;
    }
    expect(get_result.rows).toHaveLength(item_id_list.length);
  });
});

describe("Get Matching Items tests", () => {
  test("checking with value name_am", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%name_am%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value ame_a", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%ame_a%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value ame_r", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%ame_r%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value name_am_1", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%name_am_1%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(1);
    }
  });
  test("checking with value name_ru_2", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%name_ru_2%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(1);
    }
  });
  test("checking with value nme_ru", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%nme_ru%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(0);
    }
  });
  test("checking with value category_ru", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%category_ru%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value tegory_r", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%tegory_r%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value category_am_1", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%category_am_1%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(2);
    }
  });
  test("checking with value ctgory_am", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%ctgory_am%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(0);
    }
  });
  test("checking with value description_am", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%description_am%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value scription_a", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%scription_a%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(4);
    }
  });
  test("checking with value description_am_1", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%description_am_1%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(1);
    }
  });
  test("checking with value dscription_r", async () => {
    for (const lang of lang_list) {
      const result = await Db.get_matching_items("%dscription_r%", lang, 10);
      if (result instanceof Db_Error_Response) {
        expect(result).toBe(1);
        return;
      }
      expect(result.rows).toHaveLength(0);
    }
  });
});

function create_item_edit(item_admin: T_Item_Admin_Full) {
  return Object.keys(item_admin).reduce((prev, k) => {
    const key = k as keyof T_Item_Admin_Full;
    if (key === "id" || key === "category_id" || key === "name_am" || key === "name_ru") {
      return {
        ...prev,
        [key]: item_admin[key]
      };
    }
    return {
      ...prev,
      variants: [
        {
          ...prev.variants[0],
          [key]: item_admin[key]
        }
      ]
    };
  }, { variants: [{}] } as T_Item_Body_Edit & { id: string });
}