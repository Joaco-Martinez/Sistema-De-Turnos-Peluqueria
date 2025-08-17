import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useCreateRecurring } from "../hooks/useBookings";

export default function RepetirModal({ navigation }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+54911");
  const [date, setDate] = useState(new Date());
  const [showD, setShowD] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showT, setShowT] = useState(false);
  const [interval, setInterval] = useState<"weekly"|"biweekly"|"monthly">("weekly");
  const [count, setCount] = useState(8);
  const [duration, setDuration] = useState(45);
  const [serviceName, setServiceName] = useState("");

  const recur = useCreateRecurring();

  function fmtDate(d: Date) { return format(d, "yyyy-MM-dd"); }
  function fmtTime(d: Date) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  async function onSave() {
    try {
      await recur.mutateAsync({
        client: { name, phone },
        startDate: fmtDate(date),
        time: fmtTime(time),
        intervalType: interval,
        count,
        durationMinutes: duration,
        serviceName: serviceName || undefined
      });
      Alert.alert("Listo", "Serie creada (días hábiles)");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    }
  }

  return (
    <View style={{ flex:1, padding:16, gap:10 }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>Repetir turno</Text>

      <Text>Nombre</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth:1, padding:10, borderRadius:8 }} />
      <Text>Teléfono</Text>
      <TextInput value={phone} onChangeText={setPhone} style={{ borderWidth:1, padding:10, borderRadius:8 }} />

      <Text>Fecha inicio</Text>
      <Button title={fmtDate(date)} onPress={() => setShowD(true)} />
      {showD && (
        <DateTimePicker value={date} mode="date" onChange={(_, d)=>{ setShowD(false); if(d) setDate(d); }} />
      )}

      <Text>Hora</Text>
      <Button title={fmtTime(time)} onPress={() => setShowT(true)} />
      {showT && (
        <DateTimePicker value={time} mode={Platform.OS === "ios" ? "time" : "time"} onChange={(_, d)=>{ setShowT(false); if(d) setTime(d); }} />
      )}

      <Text>Intervalo</Text>
      <View style={{ flexDirection:"row", gap:8 }}>
        <Button title="Semanal" onPress={()=>setInterval("weekly")} color={interval==="weekly"?"#0a84ff":undefined} />
        <Button title="Quincenal" onPress={()=>setInterval("biweekly")} color={interval==="biweekly"?"#0a84ff":undefined} />
        <Button title="Mensual" onPress={()=>setInterval("monthly")} color={interval==="monthly"?"#0a84ff":undefined} />
      </View>

      <Text>Ocurrencias (count)</Text>
      <TextInput value={String(count)} onChangeText={(t)=>setCount(Number(t||0))} keyboardType="numeric" style={{ borderWidth:1, padding:10, borderRadius:8 }} />

      <Text>Duración (min)</Text>
      <TextInput value={String(duration)} onChangeText={(t)=>setDuration(Number(t||0))} keyboardType="numeric" style={{ borderWidth:1, padding:10, borderRadius:8 }} />

      <Text>Servicio (opcional)</Text>
      <TextInput value={serviceName} onChangeText={setServiceName} style={{ borderWidth:1, padding:10, borderRadius:8 }} />

      <Button title="Crear serie" onPress={onSave} />
      <Button title="Cancelar" color="gray" onPress={()=>navigation.goBack()} />
    </View>
  );
}
