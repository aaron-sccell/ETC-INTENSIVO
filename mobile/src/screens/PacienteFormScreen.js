import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo, Cargando } from '../components/UI';
import { SelectorFecha, SelectorLista } from '../components/Selectores';
import { mensajeDeError } from '../api/client';
import { pacientesApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';

const SEXOS = [
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'femenino', etiqueta: 'Femenino' },
  { valor: 'otro', etiqueta: 'Otro' },
];

const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((t) => ({
  valor: t,
  etiqueta: t,
}));

const VACIO = {
  nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  sexo: 'otro',
  telefono: '',
  email: '',
  direccion: '',
  tipo_sangre: '',
  alergias: '',
  foto_url: '',
};

export default function PacienteFormScreen({ navigation, route }) {
  const { tema } = useTema();
  const pacienteId = route.params?.pacienteId;
  const esEdicion = !!pacienteId;

  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar paciente' : 'Nuevo paciente' });
  }, [navigation, esEdicion]);

  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        const paciente = await pacientesApi.obtener(pacienteId);
        setForm({
          nombre: paciente.nombre || '',
          apellidos: paciente.apellidos || '',
          fecha_nacimiento: paciente.fecha_nacimiento || '',
          sexo: paciente.sexo || 'otro',
          telefono: paciente.telefono || '',
          email: paciente.email || '',
          direccion: paciente.direccion || '',
          tipo_sangre: paciente.tipo_sangre || '',
          alergias: paciente.alergias || '',
          foto_url: paciente.foto_url || '',
        });
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudo cargar el paciente'));
      } finally {
        setCargando(false);
      }
    })();
  }, [esEdicion, pacienteId]);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  };

  const validar = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.apellidos.trim()) return 'Los apellidos son obligatorios';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return 'El correo no tiene un formato válido';
    }
    return '';
  };

  const guardar = async () => {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    // Los campos vacíos se envían como null para no guardar cadenas vacías.
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && !v.trim() ? null : v]),
    );

    setGuardando(true);
    try {
      if (esEdicion) {
        await pacientesApi.actualizar(pacienteId, payload);
      } else {
        await pacientesApi.crear(payload);
      }
      navigation.goBack();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar el paciente'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = () => {
    Alert.alert(
      'Eliminar paciente',
      'Se borrará el expediente completo (citas, notas, signos y fotos). Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await pacientesApi.eliminar(pacienteId);
              navigation.popToTop();
            } catch (e) {
              setError(mensajeDeError(e, 'No se pudo eliminar el paciente'));
            }
          },
        },
      ],
    );
  };

  if (cargando) return <Cargando />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={[styles.seccion, { color: tema.textoSuave }]}>INFORMACIÓN GENERAL</Text>

        <Campo etiqueta="Nombre(s) *" placeholder="Juan" value={form.nombre} onChangeText={set('nombre')} />
        <Campo
          etiqueta="Apellidos *"
          placeholder="Pérez García"
          value={form.apellidos}
          onChangeText={set('apellidos')}
        />
        <SelectorFecha
          etiqueta="Fecha de nacimiento"
          valor={form.fecha_nacimiento}
          onCambiar={set('fecha_nacimiento')}
        />
        <SelectorLista
          etiqueta="Sexo"
          opciones={SEXOS}
          valor={form.sexo}
          onCambiar={set('sexo')}
        />
        <Campo
          etiqueta="Teléfono"
          icono="call-outline"
          placeholder="552 123 4567"
          value={form.telefono}
          onChangeText={set('telefono')}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          placeholder="paciente@correo.com"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo
          etiqueta="Dirección"
          icono="location-outline"
          placeholder="Av. Reforma 123, CDMX"
          value={form.direccion}
          onChangeText={set('direccion')}
        />

        <Text style={[styles.seccion, { color: tema.textoSuave, marginTop: 10 }]}>
          INFORMACIÓN MÉDICA
        </Text>

        <SelectorLista
          etiqueta="Tipo de sangre"
          placeholder="Selecciona el tipo"
          opciones={TIPOS_SANGRE}
          valor={form.tipo_sangre}
          onCambiar={set('tipo_sangre')}
        />
        <Campo
          etiqueta="Alergias"
          placeholder="Ninguna conocida"
          value={form.alergias}
          onChangeText={set('alergias')}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />
        <Campo
          etiqueta="URL de la foto (opcional)"
          icono="image-outline"
          placeholder="https://..."
          value={form.foto_url}
          onChangeText={set('foto_url')}
          autoCapitalize="none"
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Boton
          titulo={esEdicion ? 'Guardar cambios' : 'Crear paciente'}
          onPress={guardar}
          cargando={guardando}
        />

        {esEdicion ? (
          <Boton
            titulo="Eliminar paciente"
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
  seccion: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 12 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
});
