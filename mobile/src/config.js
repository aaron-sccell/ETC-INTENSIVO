import Constants from 'expo-constants';

/**
 * URL base de la API de FastAPI.
 *
 * Orden de prioridad:
 *  1. La variable EXPO_PUBLIC_API_URL del archivo `.env` (la forma recomendada).
 *  2. Detección automática: toma la IP de la computadora donde corre Metro
 *     (la misma que aparece en el QR de Expo) y le agrega el puerto 8000.
 *  3. Fallback a localhost.
 *
 * Después de editar `.env` hay que reiniciar Metro con:  npx expo start -c
 */

const PUERTO_API = 8000;

function ipDeMetro() {
  // Ejemplos de hostUri: "192.168.1.72:8081" | "127.0.0.1:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';

  const host = hostUri.split(':')[0];
  return host && host !== 'localhost' ? host : null;
}

function resolverBaseUrl() {
  const desdeEnv = process.env.EXPO_PUBLIC_API_URL;
  if (desdeEnv && desdeEnv.trim().length > 0) {
    return desdeEnv.trim().replace(/\/+$/, '');
  }

  const ip = ipDeMetro();
  if (ip) return `http://${ip}:${PUERTO_API}`;

  return `http://127.0.0.1:${PUERTO_API}`;
}

export const API_URL = resolverBaseUrl();

/** Tiempo máximo de espera de cada petición (ms). */
export const API_TIMEOUT = 15000;

/** Minutos de anticipación con los que se programa el recordatorio de una cita. */
export const MINUTOS_RECORDATORIO = 60;

export default { API_URL, API_TIMEOUT, MINUTOS_RECORDATORIO };
