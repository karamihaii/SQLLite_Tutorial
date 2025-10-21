import { type SQLiteDatabase } from "expo-sqlite";

export interface Item {
  id: number;
  name: string;
  quantity: number;
}

// Initialize Database
export const initDb = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, quantity INTEGER NOT NULL);"
  );
};

// Insert Item
export const insertItem = async (db: SQLiteDatabase, name: string, quantity: number): Promise<void> => {
  await db.runAsync("INSERT INTO items (name, quantity) VALUES (?, ?);", [name, quantity]);
};

// Update Item
export const updateItem = async (db: SQLiteDatabase, id: number, name: string, quantity: number): Promise<void> => {
  await db.runAsync("UPDATE items SET name = ?, quantity = ? WHERE id = ?;", [name, quantity, id]);
};

// Delete Item
export const deleteItem = async (db: SQLiteDatabase, id: number): Promise<void> => {
  await db.runAsync("DELETE FROM items WHERE id = ?;", [id]);
};

// Fetch Items with SQL Sorting
export const fetchItems = async (
  db: SQLiteDatabase,
  sort?: "nameAZ" | "nameZA" | "qtyLH" | "qtyHL" | "qtyLH_nameAZ" | "qtyHL_nameZA"
): Promise<Item[]> => {
  let orderBy = "";

  switch (sort) {
    case "nameAZ":
      orderBy = "ORDER BY name ASC";
      break;
    case "nameZA":
      orderBy = "ORDER BY name DESC";
      break;
    case "qtyLH":
      orderBy = "ORDER BY quantity ASC";
      break;
    case "qtyHL":
      orderBy = "ORDER BY quantity DESC";
      break;
    case "qtyLH_nameAZ":
      orderBy = "ORDER BY quantity ASC, name ASC";
      break;
    case "qtyHL_nameZA":
      orderBy = "ORDER BY quantity DESC, name DESC";
      break;
  }

  return db.getAllAsync<Item>(`SELECT * FROM items ${orderBy};`);
};

