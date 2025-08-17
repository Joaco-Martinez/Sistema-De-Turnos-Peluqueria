import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import QueryProvider from "./src/provider/Query";
import RootNav from "./src/navigation";

export default function App() {
  return (
    <QueryProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <RootNav />
      </SafeAreaView>
    </QueryProvider>
  );
}
