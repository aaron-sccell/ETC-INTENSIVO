import api from './client';

/**
 * Un módulo por recurso de la API. Cada función devuelve directamente
 * `response.data` para que las pantallas no manejen el objeto de axios.
 */

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email: email.trim().toLowerCase(), password }).then((r) => r.data),

  registrar: (datos) => api.post('/auth/register', datos).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const usuariosApi = {
  perfil: () => api.get('/usuarios/me').then((r) => r.data),
  actualizarPerfil: (datos) => api.put('/usuarios/me', datos).then((r) => r.data),
  doctores: () => api.get('/usuarios').then((r) => r.data),
};

export const pacientesApi = {
  listar: (q) => api.get('/pacientes', { params: q ? { q } : {} }).then((r) => r.data),
  obtener: (id) => api.get(`/pacientes/${id}`).then((r) => r.data),
  expediente: (id) => api.get(`/pacientes/${id}/expediente`).then((r) => r.data),
  crear: (datos) => api.post('/pacientes', datos).then((r) => r.data),
  actualizar: (id, datos) => api.put(`/pacientes/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/pacientes/${id}`).then((r) => r.data),
  fotos: (id) => api.get(`/pacientes/${id}/fotos`).then((r) => r.data),
  agregarFoto: (id, datos) => api.post(`/pacientes/${id}/fotos`, datos).then((r) => r.data),
};

export const citasApi = {
  listar: (params = {}) => api.get('/citas', { params }).then((r) => r.data),
  proximas: (limit = 10) =>
    api.get('/citas', { params: { proximas: true, limit } }).then((r) => r.data),
  porPaciente: (pacienteId) =>
    api.get('/citas', { params: { paciente_id: pacienteId } }).then((r) => r.data),
  obtener: (id) => api.get(`/citas/${id}`).then((r) => r.data),
  crear: (datos) => api.post('/citas', datos).then((r) => r.data),
  actualizar: (id, datos) => api.put(`/citas/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/citas/${id}`).then((r) => r.data),
};

export const notasApi = {
  porPaciente: (pacienteId) => api.get(`/pacientes/${pacienteId}/notas`).then((r) => r.data),
  crear: (pacienteId, datos) =>
    api.post(`/pacientes/${pacienteId}/notas`, datos).then((r) => r.data),
  actualizar: (notaId, datos) => api.put(`/notas/${notaId}`, datos).then((r) => r.data),
  eliminar: (notaId) => api.delete(`/notas/${notaId}`).then((r) => r.data),
};

export const signosApi = {
  porPaciente: (pacienteId) => api.get(`/pacientes/${pacienteId}/signos`).then((r) => r.data),
  crear: (pacienteId, datos) =>
    api.post(`/pacientes/${pacienteId}/signos`, datos).then((r) => r.data),
  eliminar: (signoId) => api.delete(`/signos/${signoId}`).then((r) => r.data),
};

export const saludApi = {
  ping: () => api.get('/health').then((r) => r.data),
};
