import { Tabs } from 'expo-router';
import { colors } from '../../src/design/tokens';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brassBright,
      tabBarInactiveTintColor: colors.faint,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 66 },
      tabBarLabelStyle: { fontSize: 11, paddingBottom: 8 },
    }}>
      <Tabs.Screen name="orbit" options={{ title: 'Orbit' }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault' }} />
      <Tabs.Screen name="threads" options={{ title: 'Threads' }} />
      <Tabs.Screen name="loops" options={{ title: 'Loops' }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask' }} />
    </Tabs>
  );
}
