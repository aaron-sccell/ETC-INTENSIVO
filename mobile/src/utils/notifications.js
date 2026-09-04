import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { MINUTOS_RECORDATORIO } from '../config';
import { combinarFechaHora, fechaLarga, hora12, nombrePaciente } from './format';

/**
 * Notificaciones LOCALES (recordatorio de cita).
 *
 * Nota para Expo Go: las notificaciones *push remotas* ya no funcionan dentro de
 * Expo Go, pero las **locales programadas** —que son las que usa esta app— sí.
 */

// Cómo se muestra la notificación si la app está abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Campo antiguo, se mantiene por compatibilidad con versiones previas.
    shouldShowAlert: true,
  }),
});

const CANAL_ANDROID = 'citas';

export async function configurarNotificaciones() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Recordatorios de citas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    });
  }
}

/** Pide permiso de notificaciones. Devuelve true si quedó concedido. */
export async function pedirPermisoNotificaciones() {
  const { status: actual } = await Notifications.getPermissionsAsync();
  if (actual === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Programa el recordatorio de una cita.
 * @returns {Promise<{ok: boolean, motivo?: string, fecha?: Date}>}
 */
export async function programarRecordatorioCita(cita, minutosAntes = MINUTOS_RECORDATORIO) {
  const permiso = await pedirPermisoNotificaciones();
  if (!permiso) return { ok: false, motivo: 'Permiso de notificaciones denegado' };

  await configurarNotificaciones();

  const inicio = combinarFechaHora(cita.fecha, cita.hora);
  if (!inicio) return { ok: false, motivo: 'La cita no tiene fecha válida' };

  const disparo = new Date(inicio.getTime() - minutosAntes * 60 * 1000);
  if (disparo.getTime() <= Date.now()) {
    return { ok: false, motivo: 'La cita es demasiado pronto para programar el recordatorio' };
  }

  const paciente = nombrePaciente(cita.paciente);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de cita',
      body: `${paciente} · ${cita.motivo} · ${hora12(cita.hora)}${
        cita.consultorio ? ` · ${cita.consultorio}` : ''
      }`,
      subtitle: fechaLarga(cita.fecha),
      data: { citaId: cita.id, pacienteId: cita.paciente_id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: disparo,
      channelId: CANAL_ANDROID,
    },
  });

  return { ok: true, id, fecha: disparo };
}

/** Notificación inmediata (útil para demostrar la función en el video). */
export async function notificacionDePrueba() {
  const permiso = await pedirPermisoNotificaciones();
  if (!permiso) return { ok: false, motivo: 'Permiso de notificaciones denegado' };

  await configurarNotificaciones();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificaciones activas',
      body: 'Así se verán los recordatorios de tus citas.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CANAL_ANDROID,
    },
  });
  return { ok: true };
}

export async function recordatoriosProgramados() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function cancelarTodosLosRecordatorios() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
