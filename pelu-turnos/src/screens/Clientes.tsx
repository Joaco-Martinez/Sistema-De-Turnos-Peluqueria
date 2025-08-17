import React from "react";
import { View, Text, FlatList } from "react-native";
import { useClients } from "../hooks/useClients";

export default function Clientes() {
  const { data, isLoading } = useClients();
  if (isLoading) return <Text style={{ padding: 16 }}>Cargando…</Text>;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontWeight: "700" }}>{item.name}</Text>
            <Text>{item.phone}</Text>
          </View>
        )}
      />
    </View>
  );
}
