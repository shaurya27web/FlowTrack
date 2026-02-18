import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await AsyncStorage.getItem('items');
      if (data) setItems(JSON.parse(data));
    } catch (e) {
      Alert.alert('Error', 'Failed to load');
    }
  };

  const saveItems = async (newItems) => {
    try {
      await AsyncStorage.setItem('items', JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    }
  };

  const addItem = () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter something');
      return;
    }
    const newItem = { id: Date.now().toString(), text: input };
    saveItems([...items, newItem]);
    setInput('');
  };

  const updateItem = () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter something');
      return;
    }
    const updated = items.map(item => 
      item.id === editingId ? { ...item, text: input } : item
    );
    saveItems(updated);
    setInput('');
    setEditingId(null);
  };

  const deleteItem = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        onPress: () => saveItems(items.filter(item => item.id !== id)),
        style: 'destructive'
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRUD App</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Enter item"
        />
        {editingId ? (
          <TouchableOpacity style={styles.updateBtn} onPress={updateItem}>
            <Text style={styles.btnText}>Update</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.btnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {editingId && (
        <TouchableOpacity onPress={() => {
          setInput('');
          setEditingId(null);
        }}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No items yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.buttons}>
              <TouchableOpacity onPress={() => {
                setInput(item.text);
                setEditingId(item.id);
              }}>
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      
      {items.length > 0 && (
        <Text style={styles.total}>Total: {items.length}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E86C1', textAlign: 'center', marginBottom: 20 },
  inputRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: 'white' },
  addBtn: { backgroundColor: '#28B463', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  updateBtn: { backgroundColor: '#F39C12', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  cancel: { color: '#E74C3C', textAlign: 'center', marginBottom: 10 },
  list: { flex: 1, marginTop: 10 },
  empty: { textAlign: 'center', color: '#999', marginTop: 50 },
  item: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { fontSize: 16 },
  buttons: { flexDirection: 'row' },
  edit: { color: '#F39C12', marginRight: 15, fontWeight: 'bold' },
  delete: { color: '#E74C3C', fontWeight: 'bold' },
  total: { textAlign: 'center', padding: 10, backgroundColor: 'white', borderRadius: 8, marginTop: 10 }
});