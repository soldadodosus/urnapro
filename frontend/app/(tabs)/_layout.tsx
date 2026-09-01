import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Tabs } from "expo-router";

const isModernIOS = Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26;

export default function TabsLayout() {
  if (isModernIOS) {
    // Native tabs are enabled by the platform on supported iOS versions.
    // The classic navigator below remains the compatible fallback elsewhere.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeTabs, Icon, Label } = require("expo-router/unstable-native-tabs");
    return <NativeTabs><NativeTabs.Trigger name="index"><Icon sf="chart.bar.fill" drawable="ic_menu_sort_by_size" /><Label>Painel</Label></NativeTabs.Trigger><NativeTabs.Trigger name="data"><Icon sf="square.and.pencil" drawable="ic_menu_edit" /><Label>Dados</Label></NativeTabs.Trigger><NativeTabs.Trigger name="team"><Icon sf="person.2.fill" drawable="ic_menu_myplaces" /><Label>Equipe</Label></NativeTabs.Trigger></NativeTabs>;
  }

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1F4E3D", tabBarInactiveTintColor: "#93918C", tabBarStyle: { ...(Platform.OS === "web" ? { height: 64 } : {}), backgroundColor: "#FFFFFF", borderTopColor: "#E5E5EA" }, tabBarItemStyle: { alignSelf: "center" } }}>
    <Tabs.Screen name="index" options={{ title: "Painel", tabBarButtonTestID: "tab-dashboard", tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} /> }} />
    <Tabs.Screen name="data" options={{ title: "Dados", tabBarButtonTestID: "tab-data", tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="team" options={{ title: "Equipe", tabBarButtonTestID: "tab-team", tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
  </Tabs>;
}