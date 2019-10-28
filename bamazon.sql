DROP DATABASE IF EXISTS bamazon_db;

CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(45) NOT NULL,
  department_name VARCHAR(45) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER(5) NULL,
  PRIMARY KEY (id)
);

INSERT INTO inventory (product_name, department_name, price, stock_quantity)
VALUES ("Vitamix Blender", "Kitchen", 299.99, 20), ("Pulse Oximeter", "Health", 20.99, 40), ("Cooking Thermometer Probe", "Kitchen", 12.99, 50), ("Jimi Hendrix Poster", "Art", 19.99, 10), ("Peak Flow Meter", "Health", 14.75, 15), ("Mouse Pad", "Electronics", 13.99, 55), ("Wireless Keyboard", "Electronics", 30.99, 22), ("Pizza Baking Stone", "Kitchen", 40.99, 5), ("RCA Audio Subwoofer Cable - 8 feet", "Electronics", 7.99, 8), ("Greenie Dog Treats", "Pet", 7.99, 60), ("Yoga Mat with Carrying Strap", "Health", 10.99, 30), ("Gold Leaf Picture Frames 3-pack", "Art", 26.99, 6), ("Dog Harness XS", "Pet", 34.99, 11);