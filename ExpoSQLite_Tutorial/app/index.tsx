import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import {
  deleteItem,
  fetchItems,
  insertItem,
  updateItem,
  type Item,
} from "../data/db";
import ItemRow from "./components/ItemRow";

export default function App() {
  const db = useSQLiteContext();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMethod, setSortMethod] = useState<
    "nameAZ" | "nameZA" | "qtyLH" | "qtyHL" | "qtyLH_nameAZ" | "qtyHL_nameZA"
  >("nameAZ");

  useEffect(() => {
    loadItems();
  }, [sortMethod]);

  const loadItems = async () => {
    try {
      const value = await fetchItems(db, sortMethod);
      setItems(value);
    } catch (err) {
      console.log("Failed to fetch items", err);
    }
  };

  const saveOrUpdate = async () => {
    if (!name.trim() || quantity === null) return;

    try {
      if (editingId === null) {
        await insertItem(db, name.trim(), quantity);
      } else {
        await updateItem(db, editingId, name.trim(), quantity);
      }
      setName("");
      setQuantity(null);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      console.log("Failed to save/update item", err);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(item.quantity);
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
            if (editingId === id) {
              setEditingId(null);
              setName("");
              setQuantity(null);
            }
            await loadItems();
          } catch (err) {
            console.log("Failed to delete item", err);
          }
        },
      },
    ]);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.title}>SQLite Example with SQL Sort</Text>

        <TextInput
          style={styles.input}
          placeholder="Item Name"
          value={name}
          onChangeText={setName}
        />
      
        {/* Quantity Dropdown */}
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={quantity !== null ? String(quantity) : ""}
          onChangeText={(text) => {
            // Allow only numbers
            const numeric = text.replace(/[^0-9]/g, "");
            setQuantity(numeric ? parseInt(numeric, 10) : null);
          }}
          keyboardType="numeric"
        />

        <Button
          title={editingId === null ? "Save Item" : "Update Item"}
          onPress={saveOrUpdate}
        />

        {/* Combined Sort Dropdown */}
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setSortMenuVisible(true)}
            >
              <Text style={styles.menuButtonText}>
                Sort:{" "}
                {{
                  nameAZ: "Name A→Z",
                  nameZA: "Name Z→A",
                  qtyLH: "Quantity Low→High",
                  qtyHL: "Quantity High→Low",
                  qtyLH_nameAZ: "Qty Low→High + Name A→Z",
                  qtyHL_nameZA: "Qty High→Low + Name Z→A",
                }[sortMethod]}
              </Text>
            </TouchableOpacity>
          }
        >
          <Menu.Item
            title="Name A → Z"
            onPress={() => {
              setSortMethod("nameAZ");
              setSortMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Name Z → A"
            onPress={() => {
              setSortMethod("nameZA");
              setSortMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Quantity Low → High"
            onPress={() => {
              setSortMethod("qtyLH");
              setSortMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Quantity High → Low"
            onPress={() => {
              setSortMethod("qtyHL");
              setSortMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Qty Low→High + Name A→Z"
            onPress={() => {
              setSortMethod("qtyLH_nameAZ");
              setSortMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Qty High→Low + Name Z→A"
            onPress={() => {
              setSortMethod("qtyHL_nameZA");
              setSortMenuVisible(false);
            }}
          />
        </Menu>

        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#eee", margin: 14 }} />
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
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  menuButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },
  menuButtonText: { fontSize: 16, color: "#333" },
  list: { marginTop: 20, width: "100%" },
});

