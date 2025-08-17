import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { api } from "../lib/api";

export default function Ajustes() {
  const [health, setHealth] = useState<string>("…");

  useEffect(() => {
    api.get("/health".replace("/api", "")) // tu /health está fuera de /api
      .then(() => setHealth("✅ OK"))
      .catch(() => setHealth("❌ Caído"));
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Ajustes</Text>
      <Text>Backend: {health}</Text>
    </View>
  );
}
