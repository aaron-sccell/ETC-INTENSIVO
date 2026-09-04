import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo } from '../components/UI';
import { SelectorFecha } from '../components/Selectores';
import { mensajeDeError } from '../api/client';
import { notasApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import { aISO } from '../utils/format';

export default function NotaFormScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId, nota } = route.params;
  const esEdicion = !!nota;

  const [form, setForm] = useState({
    fecha: nota?.fecha ?? aISO(new Date()),
    titulo: nota?.titulo ?? '',
    contenido: nota?.contenido ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar nota' : 'Nueva nota médica' });
  }, [navigation, esEdicion]);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  };

  const guardar = async () => {
    if (!form.contenido.trim()) {
      setError('Escribe el contenido de la nota');
      return;
    }

    const payload = {
      fecha: form.fecha,
      titulo: form.titulo.trim() || null,
      contenido: form.contenido.trim(),
    };

    setGuardando(true);
    try {
      if (esEdicion) {
        await notasApi.actualizar(nota.id, payload);
      } else {
        await notasApi.crear(pacienteId, payload);
      }
      navigation.goBack();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar la nota'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <SelectorFecha etiqueta="Fecha" valor={form.fecha} onCambiar={set('fecha')} />

        <Campo
          etiqueta="Título (opcional)"
          placeholder="Control general"
          value={form.titulo}
          onChangeText={set('titulo')}
        />

        <Campo
          etiqueta="Nota clínica"
          placeholder="Paciente en buen estado general. Peso: 75 kg, Presión: 120/80..."
          value={form.contenido}
          onChangeText={set('contenido')}
          multiline
          style={{ minHeight: 160, textAlignVertical: 'top' }}
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Boton
          titulo={esEdicion ? 'Guardar cambios' : 'Guardar nota'}
          onPress={guardar}
          cargando={guardando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 18, paddingBottom: 48 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
});
