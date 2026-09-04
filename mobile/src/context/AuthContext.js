import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mensajeDeError, registrarManejadorSesionExpirada, tokenStorage } from '../api/client';
import { authApi, usuariosApi } from '../api/services';

const KEY_RECORDARME = 'clinica_recordarme';
const KEY_EMAIL = 'clinica_ultimo_email';

const AuthContext = createContext(null);

/**
 * Guarda el JWT en expo-secure-store y expone el usuario autenticado
 * al resto de la aplicación.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const cerrarSesionLocal = useCallback(async () => {
    await tokenStorage.limpiar();
    setUsuario(null);
  }, []);

  // Restaura la sesión guardada al abrir la app.
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccess();
        if (!token) return;

        const guardado = await tokenStorage.getUsuario();
        if (guardado) setUsuario(guardado);

        // Valida el token contra la API y refresca los datos del perfil.
        try {
          const perfil = await usuariosApi.perfil();
          setUsuario(perfil);
          await tokenStorage.guardarUsuario(perfil);
        } catch (error) {
          if (error.response?.status === 401) await cerrarSesionLocal();
        }
      } finally {
        setCargandoSesion(false);
      }
    })();
  }, [cerrarSesionLocal]);

  // Si el interceptor de axios no logra refrescar el token, cerramos sesión.
  useEffect(() => {
    registrarManejadorSesionExpirada(() => {
      cerrarSesionLocal();
    });
  }, [cerrarSesionLocal]);

  const iniciarSesion = useCallback(async (email, password, recordarme = true) => {
    setProcesando(true);
    try {
      const data = await authApi.login(email, password);
      await tokenStorage.guardarSesion(data);
      await AsyncStorage.setItem(KEY_RECORDARME, String(recordarme));
      await AsyncStorage.setItem(KEY_EMAIL, recordarme ? email.trim() : '');
      setUsuario(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, mensaje: mensajeDeError(error, 'No se pudo iniciar sesión') };
    } finally {
      setProcesando(false);
    }
  }, []);

  const registrar = useCallback(async (datos) => {
    setProcesando(true);
    try {
      const data = await authApi.registrar(datos);
      await tokenStorage.guardarSesion(data);
      setUsuario(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, mensaje: mensajeDeError(error, 'No se pudo crear la cuenta') };
    } finally {
      setProcesando(false);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // El logout es informativo: aunque falle, borramos el token local.
    }
    await cerrarSesionLocal();
  }, [cerrarSesionLocal]);

  const actualizarPerfil = useCallback(async (datos) => {
    setProcesando(true);
    try {
      const perfil = await usuariosApi.actualizarPerfil(datos);
      setUsuario(perfil);
      await tokenStorage.guardarUsuario(perfil);
      return { ok: true };
    } catch (error) {
      return { ok: false, mensaje: mensajeDeError(error, 'No se pudo actualizar el perfil') };
    } finally {
      setProcesando(false);
    }
  }, []);

  const credencialesRecordadas = useCallback(async () => {
    const [recordarme, email] = await Promise.all([
      AsyncStorage.getItem(KEY_RECORDARME),
      AsyncStorage.getItem(KEY_EMAIL),
    ]);
    return { recordarme: recordarme === 'true', email: email || '' };
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      autenticado: !!usuario,
      cargandoSesion,
      procesando,
      iniciarSesion,
      registrar,
      cerrarSesion,
      actualizarPerfil,
      credencialesRecordadas,
    }),
    [
      usuario,
      cargandoSesion,
      procesando,
      iniciarSesion,
      registrar,
      cerrarSesion,
      actualizarPerfil,
      credencialesRecordadas,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export default AuthContext;
