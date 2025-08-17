import React, { useMemo } from "react";
import { View, Text, FlatList, Button, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import {
  useBookings,
  useCancelBooking,
  useCompleteBooking,
} from "../hooks/useBookings";

export default function Hoy() {
  const navigation = useNavigation<any>(); // 👈 obtenés navigation
  const today = useMemo(() => new Date(), []);
  const from = format(today, "yyyy-MM-dd");
  const to = from;

  const { data = [], isLoading, isFetching, refetch } = useBookings({ from, to });
  const complete = useCompleteBooking();
  const cancel = useCancelBooking();

  if (isLoading) return <Text style={{ padding: 16 }}>Cargando…</Text>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        Turnos de hoy — {format(today, "dd/MM")}
      </Text>

      <Button
        title="Nuevo turno"
        onPress={() =>
          navigation.navigate("TurnoNuevo", { dateISO: today.toISOString() })
        }
      />

      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#fff",
              marginVertical: 6,
              elevation: 1,
            }}
          >
            <Text style={{ fontWeight: "700" }}>
              {new Date(item.startsAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {item.client?.name} ({item.client?.phone})
            </Text>
            <Text>
              {item.serviceName ?? "General"} — {item.durationMinutes} min —{" "}
              {item.status}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => complete.mutate(item.id)}>
                <Text style={{ color: "green", fontWeight: "700" }}>
                  Completar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => cancel.mutate(item.id)}>
                <Text style={{ color: "tomato", fontWeight: "700" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No hay turnos hoy.</Text>}
        onRefresh={refetch}
        refreshing={isFetching} // 👈 muestra spinner al hacer pull-to-refresh
      />
    </View>
  );
}
