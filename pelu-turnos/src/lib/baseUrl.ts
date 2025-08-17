import { Platform } from "react-native";

export function getApiBaseURL() {
  const PORT = 3000;

  // Si estás en un emulador de Android → usar 10.0.2.2
  if (Platform.OS === "android") return `http://10.0.2.2:${PORT}/api`;

  // Si estás en iOS simulador o Web
  if (Platform.OS === "ios") return `http://localhost:${PORT}/api`;

  // Si estás en dispositivo físico (Android o iOS real) → usar IP de tu PC
  return `http://192.168.0.174:${PORT}/api`;
}
