import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCreateBooking } from "../hooks/useBookings";

export default function TurnoNuevoModal({ navigation, route }: any) {
  const preset: string | undefined = route?.params?.dateISO;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+54911");
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(45);
  const [date, setDate] = useState(preset ? new Date(preset) : new Date());
  const [showPicker, setShowPicker] = useState(false);

  const create = useCreateBooking();

  async function onSave() {
    if (!name || !phone) return Alert.alert("Faltan datos", "Nombre y teléfono son obligatorios");
    const payload = {
      client: { name, phone },
      startsAt: date.toISOString(),
      durationMinutes: duration,
      serviceName: serviceName || undefined,
    };
    try {
      await create.mutateAsync(payload);
      Alert.alert("Listo", "Turno creado");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message || "No se pudo crear");
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Nuevo turno</Text>

      <Text>Nombre</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Juan" style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Teléfono</Text>
      <TextInput value={phone} onChangeText={setPhone} placeholder="+54911..." style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Servicio (opcional)</Text>
      <TextInput value={serviceName} onChangeText={setServiceName} placeholder="Corte" style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Duración (min)</Text>
      <TextInput
        value={String(duration)}
        onChangeText={(t) => setDuration(Number(t || 0))}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text>Fecha y hora</Text>
      <Button title={date.toLocaleString()} onPress={() => setShowPicker(true)} />
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={(_, d) => { setShowPicker(false); if (d) setDate(d); }}
        />
      )}

      <Button title="Guardar" onPress={onSave} />
      <Button title="Cancelar" color="gray" onPress={() => navigation.goBack()} />
    </View>
  );
}
