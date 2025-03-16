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
//       src: ['photo_src_1_abcdefghijklmnop', 'photo_src_2_abcdefghijklmnop']
//     }
//   ]
// }

import category_methods from "../../src/db/category-methods";
import item_methods from "../../src/db/item-methods";
import Db from "../../src/db/photo-methods";
import { Db_Error_Response } from "../../src/db/responses";
import { T_ID } from "../../src/types";

const wrong_id = "0a773263-ddaf-4c44-b5f0-8de15f81599f";
let item_id_list: T_ID[] = [];
let category_id_list: T_ID[] = [];

beforeEach(async () => {
  const result = await category_methods.populate_category_tbl() as { id: string }[];
  category_id_list = result.map(c => c.id);
  const id_list = await item_methods.populate_item_tbl(category_id_list) as string[];
  item_id_list = id_list;
});
afterEach(async () => {
  await item_methods.clear_item_tbl();
  await category_methods.clear_category_tbl();
});

describe("Get Photo tests", () => {
  test("checking with existing photo_ids", async () => {
    for (const item_id of item_id_list) {
      const get_item_result = await item_methods.get_item_admin(item_id);
      if (get_item_result instanceof Db_Error_Response) {
        expect(get_item_result).toBe(1);
        return;
      }
      for (let i = 1; i < 3; i++) {
        const result = await Db.get_photo(get_item_result.rows[0].photo_id, i.toString());
        if (result instanceof Db_Error_Response) {
          expect(result).toBe(1);
          return;
        }
        expect(result.rows[0].src).toBe(`photo_src_${i}_abcdefghijklmnop`);
      }
    }
  });
  test("checking with a non existing photo_id", async () => {
    const result = await Db.get_photo(wrong_id, "1");
    if (result instanceof Db_Error_Response) {
      expect(result).toBe(1);
      return;
    }
    expect(result.rows).toHaveLength(0);
  });
});