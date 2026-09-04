/** Helpers de formato de fechas, horas y texto. Sin dependencias externas. */

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_CORTOS = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

export const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** "2026-05-24" -> Date local (evita el desfase de zona horaria de new Date(str)). */
export function aDate(fechaISO) {
  if (!fechaISO) return null;
  if (fechaISO instanceof Date) return fechaISO;
  const [y, m, d] = String(fechaISO).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Date -> "2026-05-24" */
export function aISO(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** "2026-05-24" -> "24 Mayo 2026" */
export function fechaLarga(fechaISO) {
  const d = aDate(fechaISO);
  if (!d) return '';
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-05-24" -> "24/05/2026" */
export function fechaCorta(fechaISO) {
  const d = aDate(fechaISO);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** "2026-05-24" -> { dia: "24", mes: "MAY" } para las tarjetas de cita. */
export function diaYMes(fechaISO) {
  const d = aDate(fechaISO);
  if (!d) return { dia: '--', mes: '---' };
  return { dia: String(d.getDate()).padStart(2, '0'), mes: MESES_CORTOS[d.getMonth()] };
}

/** "14:30:00" -> "02:30 PM" */
export function hora12(horaISO) {
  if (!horaISO) return '';
  const [hStr, mStr] = String(horaISO).split(':');
  let h = Number(hStr);
  const sufijo = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${mStr ?? '00'} ${sufijo}`;
}

/** Date -> "14:30:00" */
export function horaISO(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
}

/** Combina "2026-05-24" + "10:00:00" en un objeto Date local. */
export function combinarFechaHora(fechaISO, horaStr) {
  const d = aDate(fechaISO);
  if (!d) return null;
  const [h = 0, m = 0] = String(horaStr || '00:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Iniciales para el avatar cuando no hay foto: "Juan Pérez" -> "JP". */
export function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function capitalizar(texto = '') {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "masculino" -> "Masculino"; sirve para la ficha del paciente. */
export function etiquetaSexo(sexo) {
  const mapa = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };
  return mapa[sexo] || 'Otro';
}

export function etiquetaEstado(estado) {
  const mapa = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    completada: 'Completada',
  };
  return mapa[estado] || capitalizar(estado || '');
}

/** Devuelve true si la cita es de hoy o de una fecha futura. */
export function esProxima(fechaISO) {
  const d = aDate(fechaISO);
  if (!d) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return d >= hoy;
}

export function nombrePaciente(paciente) {
  if (!paciente) return 'Paciente';
  return paciente.nombre_completo || `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim();
}
