ROLLBACK;
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE DOMAIN ID AS UUID 
  DEFAULT uuid_generate_v4() NOT NULL;

CREATE DOMAIN SIZE_UNIT AS VARCHAR(3)
  CHECK(value ~ '^mm$|^cm$|^m$');

CREATE DOMAIN MIN_ORDER_UNIT AS VARCHAR(5)
  CHECK(value ~ '^pcs$|^cm$|^box$|^roll$');
  
CREATE TABLE user_tbl (
  id ID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(73) NOT NULL,
  refresh_token TEXT
);

CREATE TABLE category_tbl (
  id ID PRIMARY KEY,
  label_am VARCHAR(255),
  label_ru VARCHAR(255)
);

CREATE TABLE item_tbl (
  id ID PRIMARY KEY,
  category_id UUID NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  name_ru VARCHAR(255) NOT NULL,

  CONSTRAINT fk_category
    FOREIGN KEY(category_id)
    REFERENCES category_tbl(id)
);

CREATE TABLE item_photo_tbl (
  id ID PRIMARY KEY,
  item_id UUID NOT NULL,
  src TEXT NOT NULL,

  CONSTRAINT fk_item
    FOREIGN KEY(item_id)
    REFERENCES item_tbl(id)
    ON DELETE CASCADE
);

CREATE TABLE item_size_tbl (
  id ID PRIMARY KEY,
  size_value INT NOT NULL,
  size_unit SIZE_UNIT NOT NULL
); 

CREATE TABLE item_color_tbl (
  id ID PRIMARY KEY,
  color_am VARCHAR(50) NOT NULL,
  color_ru VARCHAR(50) NOT NULL
);

CREATE TABLE item_info_tbl (
  item_id UUID NOT NULL,
  photo_id UUID NOT NULL,
  price INT NOT NULL,
  promo INT,
  size_id UUID NOT NULL,
  color_id UUID NOT NULL,
  min_order_value INT NOT NULL,
  min_order_unit MIN_ORDER_UNIT NOT NULL,
  description_am TEXT,
  description_ru TEXT,

  CONSTRAINT fk_item
    FOREIGN KEY(item_id)
    REFERENCES item_tbl(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_photo
    FOREIGN KEY(photo_id)
    REFERENCES item_photo_tbl(id),
  CONSTRAINT fk_size
    FOREIGN KEY(size_id)
    REFERENCES item_size_tbl(id),
  CONSTRAINT fk_color
    FOREIGN KEY(color_id)
    REFERENCES item_color_tbl(id)
);

COMMIT;