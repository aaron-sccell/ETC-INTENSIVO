import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTema } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { configurarNotificaciones } from './src/utils/notifications';

/** Ajusta la barra de estado al tema activo. */
function BarraEstado() {
  const { modoOscuro } = useTema();
  return <StatusBar style={modoOscuro ? 'light' : 'dark'} />;
}

export default function App() {
  useEffect(() => {
    // Crea el canal de notificaciones de Android al arrancar.
    configurarNotificaciones().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BarraEstado />
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
