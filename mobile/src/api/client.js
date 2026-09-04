import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { API_TIMEOUT, API_URL } from '../config';

const KEY_ACCESS = 'clinica_access_token';
const KEY_REFRESH = 'clinica_refresh_token';
const KEY_USER = 'clinica_user';

/**
 * expo-secure-store no existe en web; ahí caemos a AsyncStorage.
 * En iOS/Android el token se guarda cifrado en el Keychain / Keystore.
 */
const almacen = {
  async get(key) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  async set(key, value) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch {
      return AsyncStorage.setItem(key, value);
    }
  },
  async remove(key) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch {
      return AsyncStorage.removeItem(key);
    }
  },
};

export const tokenStorage = {
  getAccess: () => almacen.get(KEY_ACCESS),
  getRefresh: () => almacen.get(KEY_REFRESH),

  async guardarSesion({ access_token, refresh_token, user }) {
    await almacen.set(KEY_ACCESS, access_token);
    if (refresh_token) await almacen.set(KEY_REFRESH, refresh_token);
    if (user) await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
  },

  async getUsuario() {
    const raw = await AsyncStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  },

  async guardarUsuario(user) {
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
  },

  async limpiar() {
    await almacen.remove(KEY_ACCESS);
    await almacen.remove(KEY_REFRESH);
    await AsyncStorage.removeItem(KEY_USER);
  },
};

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

/** Callback que el AuthContext registra para forzar el cierre de sesión. */
let onSesionExpirada = null;
export function registrarManejadorSesionExpirada(fn) {
  onSesionExpirada = fn;
}

// --- Request: adjunta el header Authorization: Bearer <token> ---------------
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response: intenta refrescar el token una sola vez ante un 401 ----------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !original._reintentado && !original.url?.includes('/auth/')) {
      original._reintentado = true;
      const refreshToken = await tokenStorage.getRefresh();

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { timeout: API_TIMEOUT },
          );
          await tokenStorage.guardarSesion(data);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          await tokenStorage.limpiar();
          if (onSesionExpirada) onSesionExpirada();
        }
      } else if (onSesionExpirada) {
        onSesionExpirada();
      }
    }

    return Promise.reject(error);
  },
);

/** Convierte cualquier error de axios en un mensaje legible para el usuario. */
export function mensajeDeError(error, respaldo = 'Ocurrió un error inesperado') {
  if (!error) return respaldo;

  if (error.code === 'ECONNABORTED') {
    return 'La petición tardó demasiado. Revisa que el servidor esté encendido.';
  }

  if (!error.response) {
    return `No se pudo conectar con el servidor (${API_URL}). Verifica que la API esté corriendo y que el celular esté en la misma red Wi-Fi.`;
  }

  const { status, data } = error.response;

  if (data?.errores?.length) {
    return data.errores.map((e) => `${e.campo}: ${e.mensaje}`).join('\n');
  }
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d) => d.msg).join('\n');
  }

  const porCodigo = {
    400: 'Los datos enviados no son válidos.',
    401: 'Tu sesión expiró. Inicia sesión de nuevo.',
    403: 'No tienes permisos para hacer esto.',
    404: 'No se encontró el recurso solicitado.',
    500: 'Error interno del servidor.',
  };
  return porCodigo[status] || respaldo;
}

export default api;
