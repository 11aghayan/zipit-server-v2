import { T_Lang } from "../../src/types";
import { remove_duplicates, short_items_keys } from "../../src/util/db-utils";

describe("short_item_keys tests", () => {
  const keys_am = `
    item_tbl.id, 
    name_am as name,
    photo_id,
    price,
    promo,
    special_group,
    size_value,
    size_unit,
    color_am as color
  `;
const keys_ru = `
    item_tbl.id, 
    name_ru as name,
    photo_id,
    price,
    promo,
    special_group,
    size_value,
    size_unit,
    color_ru as color
  `;

  test("short_items_keys(am)", () => {
    expect(short_items_keys("am")).toBe(keys_am);
  });
  test("short_items_keys(ru)", () => {
    expect(short_items_keys("ru")).toBe(keys_ru);
  });
  test("short_items_keys(fr)", () => {
    expect(short_items_keys("fr" as T_Lang)).toBe(keys_am);
  });
});

describe("remove_duplicates tests", () => {
  const expected_id_list = [{id: "1"}, {id: "2"}, {id: "3"}];
  
  test("remove_duplicates with repeating ids", () => {
    const id_list = [{id: "1"}, {id: "2"}, {id: "2"}, {id: "3"}, {id: "1"}];
    expect(remove_duplicates(id_list)).toEqual(expected_id_list);
  });
  
  test("remove_duplicates with unique ids", () => {
    const id_list = [{id: "1"}, {id: "2"}, {id: "3"}];
    expect(remove_duplicates(id_list)).toEqual(expected_id_list);
  });
});