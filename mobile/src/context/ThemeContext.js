import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import { temaClaro, temaOscuro } from '../theme/theme';

const KEY_MODO = 'clinica_modo_oscuro';

const ThemeContext = createContext(null);

/**
 * Controla el modo claro/oscuro. Arranca siguiendo el tema del sistema y,
 * si el usuario mueve el switch de Ajustes, guarda su preferencia.
 */
export function ThemeProvider({ children }) {
  const esquemaSistema = useColorScheme();
  const [modoOscuro, setModoOscuro] = useState(esquemaSistema === 'dark');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(KEY_MODO);
        if (guardado !== null) setModoOscuro(guardado === 'true');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const alternarModoOscuro = useCallback(async (valor) => {
    setModoOscuro((actual) => {
      const nuevo = typeof valor === 'boolean' ? valor : !actual;
      AsyncStorage.setItem(KEY_MODO, String(nuevo)).catch(() => {});
      return nuevo;
    });
  }, []);

  const valor = useMemo(
    () => ({
      tema: modoOscuro ? temaOscuro : temaClaro,
      modoOscuro,
      alternarModoOscuro,
      cargandoTema: cargando,
    }),
    [modoOscuro, alternarModoOscuro, cargando],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de <ThemeProvider>');
  return ctx;
}

export default ThemeContext;
