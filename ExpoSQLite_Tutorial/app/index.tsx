import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchItems, insertItem, deleteItem, updateItem, type Item } from "../data/db";
import ItemRow from "./components/ItemRow";
import { Menu, Button as PaperButton } from "react-native-paper";

export default function App() {
  const db = useSQLiteContext();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [items, setItems] = useState<Item[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // ✅ Memoize loadItems to prevent re-creation on every render
  const loadItems = useCallback(async () => {
    try {
      const value = await fetchItems(db, sortOrder);
      setItems(value);
    } catch (err) {
      console.log("Failed to fetch items", err);
    }
  }, [db, sortOrder]);

  // ✅ Only re-run when sortOrder changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const saveOrUpdate = async () => {
    if (!name.trim()) return;
    const parsedQuantity = parseInt(quantity, 10);
    if (Number.isNaN(parsedQuantity)) return;

    try {
      if (editingId === null) {
        await insertItem(db, name.trim(), parsedQuantity);
      } else {
        await updateItem(db, editingId, name.trim(), parsedQuantity);
      }
      await loadItems();
      setName("");
      setQuantity("");
      setEditingId(null);
    } catch (err) {
      console.log("Failed to save/update item", err);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(db, id);
            await loadItems();
            if (editingId === id) {
              setEditingId(null);
              setName("");
              setQuantity("");
            }
          } catch (err) {
            console.log("Failed to delete item", err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Example</Text>
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <Button
        title={editingId === null ? "Save Item" : "Update Item"}
        onPress={saveOrUpdate}
      />

      <View style={{ marginTop: 20 }}>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <PaperButton
              mode="outlined"
              onPress={openMenu}
              contentStyle={{ flexDirection: "row", justifyContent: "space-between" }}
              style={{ width: 200, borderRadius: 8 }}
              uppercase={false}
            >
              {sortOrder === "ASC" ? "A to Z" : "Z to A"}
            </PaperButton>
          }
        >
          <Menu.Item
            onPress={() => {
              setSortOrder("ASC");
              closeMenu();
            }}
            title="A to Z"
          />
          <Menu.Item
            onPress={() => {
              setSortOrder("DESC");
              closeMenu();
            }}
            title="Z to A"
          />
        </Menu>
      </View>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "#eee", marginHorizontal: 14 }} />
        )}
        renderItem={({ item }) => (
          <ItemRow
            name={item.name}
            quantity={item.quantity}
            onEdit={() => startEdit(item)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 24, color: "#888" }}>
            No items yet. Add your first one above.
          </Text>
        }
        contentContainerStyle={
          items.length === 0 ? { flexGrow: 1, justifyContent: "center" } : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
  list: {
    marginTop: 20,
    width: "100%",
  },
});
