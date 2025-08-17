import React, { useState } from "react";
import { View, Text, Button, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBookings } from "../hooks/useBookings";

export default function Dia() {
  const navigation = useNavigation<any>();              // 👈 navigation
  const [date, setDate] = useState(new Date());

  const from = format(date, "yyyy-MM-dd");
  const to = from;

  const { data = [], isLoading, isFetching, refetch } = useBookings({ from, to });

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", textTransform: "capitalize" }}>
        {format(date, "EEEE dd/MM", { locale: es })} ({from})
      </Text>

      <Button
        title="Nuevo turno"
        onPress={() => navigation.navigate("TurnoNuevo", { dateISO: date.toISOString() })}
      />

      {isLoading ? (
        <Text>Cargando…</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <Text style={{ marginVertical: 6 }}>
              {new Date(item.startsAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {item.client?.name} — {item.serviceName ?? "General"} — {item.status}
            </Text>
          )}
          ListEmptyComponent={<Text>No hay turnos para este día.</Text>}
          onRefresh={refetch}
          refreshing={isFetching}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="◀︎ Ayer" onPress={() => setDate(new Date(date.getTime() - 86400000))} />
        <Button title="Hoy" onPress={() => setDate(new Date())} />
        <Button title="Mañana ▶︎" onPress={() => setDate(new Date(date.getTime() + 86400000))} />
      </View>
    </View>
  );
}
