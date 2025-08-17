import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HoyScreen from "../screens/Hoy";
import DiaScreen from "../screens/Dia";
import ClientesScreen from "../screens/Clientes";
import AjustesScreen from "../screens/Ajustes";
import TurnoNuevoModal from "../screens/TurnosNuevoModal";
import RepetirModal from "../screens/RepetirModal";

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabsNav() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Hoy" component={HoyScreen} />
      <Tabs.Screen name="Agenda" component={DiaScreen} />
      <Tabs.Screen name="Clientes" component={ClientesScreen} />
      <Tabs.Screen name="Ajustes" component={AjustesScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNav() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabsNav} options={{ headerShown: false }} />
        <Stack.Screen name="TurnoNuevo" component={TurnoNuevoModal} options={{ presentation: "modal", title: "Nuevo turno" }} />
        <Stack.Screen name="Repetir" component={RepetirModal} options={{ presentation: "modal", title: "Repetir turno" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
