//@ts-nocheck

import { 
  check_category, 
  check_name, 
  check_price, 
  check_color, 
  check_min_order, 
  check_description,
  check_photo,
  check_special_group,
  check_promo,
  check_size,
  check_available,
  check_photo_id,
  check_size_id,
  check_color_id
} from "../../util/item-utils";

describe("Category ID checks", () => {
  test("checking category id for the value \"123\": string", () => {
    expect(check_category("123")).toBe(null);
  });
  test("checking category id for falsy values", () => {
    ["", "  "]
      .forEach(val => expect(check_category(val)).toBe("category_id not provided"));
  });
  test("checking category id for wrong types", () => {
    [1, true, , false, undefined, null, 0, NaN, {}, [], () => {}]
      .forEach(val => expect(check_category(val)).toBe(`typeof category_id is ${typeof val}`));
  });
});

describe("Name checks", () => {
  test("checking name for the values \"armenian name\" and \"russian name\"", () => {
    expect(check_name("armenian name", "russian name")).toBe(null);
  });
  test("checking name for falsy values", () => {
    ["", "  "]
      .forEach(val => {
        expect(check_name(val, val)).toBe("Հայերեն անվանումը նշված չէ");
        expect(check_name(val, "russian name")).toBe("Հայերեն անվանումը նշված չէ");
        expect(check_name("armenian name", val)).toBe("Ռուսերեն անվանումը նշված չէ");
      });
  });
  test("checking name for wrong types", () => {
    [1, true, false, undefined, null, 0, NaN, {}, [], () => {}]
      .forEach(val => {
        expect(check_name(val, val)).toBe(`typeof name_am is ${typeof val}`);
        expect(check_name(val, "russian name")).toBe(`typeof name_am is ${typeof val}`);
        expect(check_name("armenian name", val)).toBe(`typeof name_ru is ${typeof val}`);
      });
  });
  test("checking name for only space characters", () => {
    expect(check_name(" ", " ")).toBe("Հայերեն անվանումը նշված չէ");
    expect(check_name(" ", "russian name")).toBe("Հայերեն անվանումը նշված չէ");
    expect(check_name("armenian name", " ")).toBe("Ռուսերեն անվանումը նշված չէ");
  });
});

describe("Price checks", () => {
  test("checking price for the value 100", () => {
    expect(check_price(100)).toBe(null);
  });
  test("checking price for wrong types", () => {
    ["", "a", true, {}, [], () => {}, undefined, null, NaN]
      .forEach(val => {
        const val_json = JSON.parse(JSON.stringify({ key: val })).key;
        expect(check_price(val_json)).toBe(`typeof price is ${typeof val_json}`)
      });
  });
  test("checking price for negative value", () => {
    expect(check_price(-1)).toBe("Գինը պետք է լինի 0-ից մեծ արժեք");
  });
})

describe("Promo checks", () => {
  test("checking promo for number and null values", () => {
    [120, null]
      .forEach(val => expect(check_promo(val)).toBe(null));
  });
  test("checking promo for wrong types", () => {
    ["", "123", true, undefined, {}, [], () => {}]
      .forEach(val => {
        const val_json = JSON.parse(JSON.stringify({ key: val })).key;
        expect(check_promo(val_json)).toBe(`typeof promo is ${typeof val_json}`)
      });
  });
  test("checking promo for values less than zero", () => {
    expect(check_promo(-1)).toBe("Ակցիան պետք է լինի 0 կամ 0-ից մեծ արժեք");
  });
});

describe("Size checks", () => {
  test("checking size for size_value 1 and size_unit mm", () => {
    expect(check_size(1, "mm")).toBe(null);
  });
  test("checking size for wrong value types and unit mm", () => {
    ["", "123", true, undefined, NaN, {}, [], () => {}]
      .forEach(val => {
        const val_json = JSON.parse(JSON.stringify({ key: val })).key;
        expect(check_size(val_json, "mm")).toBe(`typeof size_value is ${typeof val_json}`)
      });
  });
  test("checking size for value less than 0 and unit mm", () => {
    expect(check_size(-1, "mm")).toBe("Չափի արժեքը պետք է լինի 0 և մեծ արժեք");
  });
  test("checking size for value 10 and wrong unit types", () => {
    [0, 1, true, undefined, NaN, {}, [], () => {}]
      .forEach(val => expect(check_size(10, val)).toBe(`typeof size_unit is ${typeof val}`));
  });
  test("checking size for value 10 and invalid size units", () => {
    ["", "km", "inch"]
      .forEach(val => expect(check_size(10, val)).toBe(`invalid size_unit: ${val}`));
  });
  test("checking size id for value \"abcdefg\"", () => {
    expect(check_size_id("abcdefg")).toBe(null);
  });
  test("checking size id for wrong types", () => {
    [NaN, null, undefined, {}, [], true, 1, 0, () => {}]
      .forEach(val => expect(check_size_id(val)).toBe(`typeof size_id is ${typeof val}`));
  });
  test("checking size id for empty string", () => {
    expect(check_size_id("")).toBe("size_id not provided");
  });
});

describe("Color checks", () => {
  test("checking color for the values \"armenian color\" and \"russian color\"", () => {
    expect(check_color("armenian color", "russian color")).toBe(null);
  });
  test("checking color for wrong types", () => {
    [1,0, false, true, undefined, null, NaN, {}, [], () => {}]
      .forEach(val => {
        expect(check_color(val, val)).toBe(`typeof color_am is ${typeof val}`);
        expect(check_color(val, "russian color")).toBe(`typeof color_am is ${typeof val}`);
        expect(check_color("armenian color", val)).toBe(`typeof color_ru is ${typeof val}`);
      });
  });
  test("checking color for only space characters", () => {
    expect(check_color(" ", " ")).toBe("Գույնի հայերեն անվանումը նշված չէ");
    expect(check_color(" ", "russian color")).toBe("Գույնի հայերեն անվանումը նշված չէ");
    expect(check_color("armenian color", " ")).toBe("Գույնի ռուսերեն անվանումը նշված չէ");
  });
  test("checking color id for value \"abcdefg\"", () => {
    expect(check_color_id("abcdefg")).toBe(null);
  });
  test("checking color id for wrong types", () => {
    [NaN, null, undefined, {}, [], true, 1, 0, () => {}]
      .forEach(val => expect(check_color_id(val)).toBe(`typeof color_id is ${typeof val}`));
  });
  test("checking color id for empty string", () => {
    expect(check_color_id("")).toBe("color_id not provided");
  });
});

describe("Min order checks", () => {
  test("checking min order for value 1 and a valid unit", () => {
    expect(check_min_order(1, "box")).toBe(null);
  });
  test("checking min order for wrong value types and unit \"box\"", () => {
    ["", "a", false, true, {}, [], () => {}, undefined, null, NaN]
      .forEach(val => { 
        const val_json = JSON.parse(JSON.stringify({ key: val })).key;
        expect(check_min_order(val_json, "box")).toBe(`typeof min_order_value is ${typeof val_json}`)
      });
  });
  test("checking min order for a negative number value and unit \"box\"", () => {
    expect(check_min_order(-1, "box")).toBe("Նվազագույն պատվերի արժեքը պետք է լինի 0-ից մեծ արժեք");
  });
  test("checking min order for value 1 and wrong unit types", () => {
    [0, 1, false, true, undefined, null, NaN, {}, [], () => {}]
      .forEach(val => {
        const val_json = JSON.parse(JSON.stringify({ key: val })).key;
        expect(check_min_order(1, val_json)).toBe(`typeof min_order_unit is ${typeof val_json}`)
      });
  });
  test("checking min order for value 1 and an invalid unit", () => {
    expect(check_min_order(1, "mm")).toBe("invalid min_order_unit: mm");
  });
});

describe("Description checks", () => {
  test("checking description for string and null values", () => {
    expect(check_description("description_am", "description_ru")).toBe(null);
    expect(check_description("", "")).toBe(null);
    expect(check_description(null, null)).toBe(null);
  });
  test("checking description for wrong types", () => {
    [1, true, undefined, NaN, {}, [], () => {}]
      .forEach(val => {
        expect(check_description(val, "description_ru")).toBe(`typeof description_am is ${typeof val}`)
        expect(check_description("description_am", val)).toBe(`typeof description_ru is ${typeof val}`);
        expect(check_description(val, val)).toBe(`typeof description_am is ${typeof val}`);
      });
  });
});

describe("Photo checks", () => {
  test("checking photo_src for a valid value: ['data:image/jpg;base64,abcdefghijklmnopqrstuvwxyz']", () => {
    expect(check_photo(["data:image/jpg;base64,abcdefghijklmnopqrstuvwxyz"])).toBe(null);
  });
  test("checking photo_src for falsy values", () => {
    ["", false, undefined, null, 0, NaN]
      .forEach(val => expect(check_photo(val)).toBe("Լուսանկարը բացակայում է"));
  });
  test("checking photo_src for non array values", () => {
    ["a", true, 1, {}, () => {}]
      .forEach(val => expect(check_photo(val)).toBe("Լուսանկարը բացակայում է"));
  });
  test("checking photo_src for an empty array", () => {
    expect(check_photo([])).toBe("Լուսանկարը բացակայում է");
  });
  test("checking for each photo_src to be of wrong type", () => {
    [[1], [true], [{}], [[]], [null], [undefined], [() => {}]]
      .forEach(val => expect(check_photo(val)).toBe(`typeof photo_src is ${typeof val[0]}; index = 0`));
  });
  test("checking for each photo_src to have length >= 20", () => {
    expect(check_photo(["abcdefgh"])).toBe("Wrong photo data; index = 0");
  });
  test("checking photo id for value \"abcdefg\"", () => {
    expect(check_photo_id("abcdefg")).toBe(null);
  });
  test("checking photo id for wrong types", () => {
    [NaN, null, undefined, {}, [], true, 1, 0, () => {}]
      .forEach(val => expect(check_photo_id(val)).toBe(`typeof photo_id is ${typeof val}`));
  });
  test("checking photo id for empty string", () => {
    expect(check_photo_id("")).toBe("photo_id not provided");
  });
});

describe("Special groups checks", () => {
  test("checking special group for valid values", () => {
    ["new", "prm", "liq", null]
      .forEach(val => expect(check_special_group(val)).toBe(null));
  });
  test("checking special group for invalid values", () => {
    [undefined, {}, [], true, 1, "asd", () => {}]
      .forEach(val => expect(check_special_group(val)).toBe("Wrong special group"));
  });
});

describe("Available checks", () => {
  test("checking available for values [0, 1]", () => {
    [0, 1]
      .forEach(val => expect(check_available(val)).toBe(null));
  });
  test("checking available for wrong types", () => {
    [NaN, null, undefined, {}, [], true, "asd", () => {}]
    .forEach(val => { 
      const val_json = JSON.parse(JSON.stringify({ key: val })).key;
      expect(check_available(val_json)).toBe(`typeof available is ${typeof val_json}`)
    });
  });
  test("checking available for value less than 0", () => {
    expect(check_available(-1)).toBe("Հասանելի քանակությունը պետք է լինի 0 կամ մեծ արժեք");
  });
});