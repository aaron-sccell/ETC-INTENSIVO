import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo, Cargando } from '../components/UI';
import { SelectorFecha, SelectorHora, SelectorLista } from '../components/Selectores';
import { mensajeDeError } from '../api/client';
import { citasApi, pacientesApi, usuariosApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { MINUTOS_RECORDATORIO } from '../config';
import { radios } from '../theme/theme';
import { aISO, hora12, nombrePaciente } from '../utils/format';
import { programarRecordatorioCita } from '../utils/notifications';

const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'confirmada', etiqueta: 'Confirmada' },
  { valor: 'completada', etiqueta: 'Completada' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
];

const CONSULTORIOS = ['Consultorio 1', 'Consultorio 2', 'Consultorio 3'].map((c) => ({
  valor: c,
  etiqueta: c,
}));

export default function CitaFormScreen({ navigation, route }) {
  const { tema } = useTema();
  const citaExistente = route.params?.cita;
  const esEdicion = !!citaExistente;

  const [form, setForm] = useState({
    paciente_id: citaExistente?.paciente_id ?? route.params?.pacienteId ?? '',
    doctor_id: citaExistente?.doctor_id ?? '',
    fecha: citaExistente?.fecha ?? aISO(new Date()),
    hora: citaExistente?.hora ?? '10:00:00',
    motivo: citaExistente?.motivo ?? '',
    consultorio: citaExistente?.consultorio ?? 'Consultorio 1',
    estado: citaExistente?.estado ?? 'pendiente',
    observaciones: citaExistente?.observaciones ?? '',
  });

  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [recordar, setRecordar] = useState(!esEdicion);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar cita' : 'Nueva cita' });
  }, [navigation, esEdicion]);

  useEffect(() => {
    (async () => {
      try {
        const [listaPacientes, listaDoctores] = await Promise.all([
          pacientesApi.listar(),
          usuariosApi.doctores(),
        ]);
        setPacientes(listaPacientes);
        setDoctores(listaDoctores);
        setForm((f) => ({ ...f, doctor_id: f.doctor_id || listaDoctores[0]?.id || '' }));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudieron cargar los catálogos'));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  };

  const validar = () => {
    if (!form.paciente_id) return 'Selecciona un paciente';
    if (!form.fecha) return 'Selecciona la fecha de la cita';
    if (!form.hora) return 'Selecciona la hora de la cita';
    if (!form.motivo.trim()) return 'Escribe el motivo de la cita';
    return '';
  };

  const guardar = async () => {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    const payload = {
      paciente_id: Number(form.paciente_id),
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
      fecha: form.fecha,
      hora: form.hora,
      motivo: form.motivo.trim(),
      consultorio: form.consultorio || null,
      estado: form.estado,
      observaciones: form.observaciones.trim() || null,
    };

    setGuardando(true);
    try {
      const cita = esEdicion
        ? await citasApi.actualizar(citaExistente.id, payload)
        : await citasApi.crear(payload);

      if (recordar) {
        const resultado = await programarRecordatorioCita(cita);
        if (!resultado.ok) {
          Alert.alert('Cita guardada', `No se programó el recordatorio: ${resultado.motivo}`);
        } else {
          Alert.alert(
            'Cita guardada',
            `Te avisaremos ${MINUTOS_RECORDATORIO} minutos antes (${hora12(
              `${String(resultado.fecha.getHours()).padStart(2, '0')}:${String(
                resultado.fecha.getMinutes(),
              ).padStart(2, '0')}`,
            )}).`,
          );
        }
      }

      navigation.goBack();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar la cita'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = () => {
    Alert.alert('Eliminar cita', '¿Seguro que quieres eliminar esta cita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await citasApi.eliminar(citaExistente.id);
            navigation.goBack();
          } catch (e) {
            setError(mensajeDeError(e, 'No se pudo eliminar la cita'));
          }
        },
      },
    ]);
  };

  if (cargando) return <Cargando />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <SelectorLista
          etiqueta="Paciente"
          placeholder="Selecciona un paciente"
          titulo="Selecciona el paciente"
          opciones={pacientes.map((p) => ({
            valor: p.id,
            etiqueta: nombrePaciente(p),
            descripcion: `ID: ${p.codigo}${p.edad != null ? ` · ${p.edad} años` : ''}`,
          }))}
          valor={form.paciente_id}
          onCambiar={set('paciente_id')}
        />

        <SelectorFecha etiqueta="Fecha" valor={form.fecha} onCambiar={set('fecha')} />
        <SelectorHora etiqueta="Hora" valor={form.hora} onCambiar={set('hora')} />

        <Campo
          etiqueta="Motivo"
          placeholder="Control general"
          value={form.motivo}
          onChangeText={set('motivo')}
        />

        <SelectorLista
          etiqueta="Doctor"
          placeholder="Selecciona un doctor"
          opciones={doctores.map((d) => ({
            valor: d.id,
            etiqueta: d.nombre,
            descripcion: d.especialidad || undefined,
          }))}
          valor={form.doctor_id}
          onCambiar={set('doctor_id')}
        />

        <SelectorLista
          etiqueta="Consultorio"
          opciones={CONSULTORIOS}
          valor={form.consultorio}
          onCambiar={set('consultorio')}
        />

        <SelectorLista
          etiqueta="Estado"
          opciones={ESTADOS}
          valor={form.estado}
          onCambiar={set('estado')}
        />

        <Campo
          etiqueta="Observaciones (opcional)"
          placeholder="Notas para la consulta"
          value={form.observaciones}
          onChangeText={set('observaciones')}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />

        {/* Recordatorio con notificación local */}
        <View style={[styles.recordatorio, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
          <View style={[styles.recordatorioIcono, { backgroundColor: tema.primarioSuave }]}>
            <Ionicons name="notifications-outline" size={19} color={tema.primario} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '700' }}>
              Recordarme esta cita
            </Text>
            <Text style={{ color: tema.textoSuave, fontSize: 11.5, marginTop: 2 }}>
              Notificación local {MINUTOS_RECORDATORIO} minutos antes
            </Text>
          </View>
          <Switch
            value={recordar}
            onValueChange={setRecordar}
            trackColor={{ false: tema.borde, true: tema.primario }}
            thumbColor="#FFFFFF"
          />
        </View>

        {error ? (
          <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Boton
          titulo={esEdicion ? 'Guardar cambios' : 'Guardar cita'}
          onPress={guardar}
          cargando={guardando}
        />

        {esEdicion ? (
          <Boton
            titulo="Eliminar cita"
            variante="peligro"
            icono="trash-outline"
            onPress={eliminar}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 18, paddingBottom: 48 },
  recordatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radios.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  recordatorioIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
});
