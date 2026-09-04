import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo } from '../components/UI';
import { SelectorFecha } from '../components/Selectores';
import { mensajeDeError } from '../api/client';
import { signosApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import { aISO } from '../utils/format';

/** Convierte el texto de un campo numérico a número, o null si está vacío. */
function aNumero(texto) {
  if (texto === null || texto === undefined) return null;
  const limpio = String(texto).replace(',', '.').trim();
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

export default function SignoFormScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId } = route.params;

  const [form, setForm] = useState({
    fecha: aISO(new Date()),
    peso: '',
    estatura: '',
    presion_sistolica: '',
    presion_diastolica: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Registrar signos vitales' });
  }, [navigation]);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  };

  const guardar = async () => {
    const payload = {
      fecha: form.fecha,
      peso: aNumero(form.peso),
      estatura: aNumero(form.estatura),
      presion_sistolica: aNumero(form.presion_sistolica),
      presion_diastolica: aNumero(form.presion_diastolica),
      temperatura: aNumero(form.temperatura),
      frecuencia_cardiaca: aNumero(form.frecuencia_cardiaca),
      notas: form.notas.trim() || null,
    };

    const tieneAlgo = ['peso', 'estatura', 'presion_sistolica', 'presion_diastolica', 'temperatura', 'frecuencia_cardiaca']
      .some((k) => payload[k] !== null);

    if (!tieneAlgo) {
      setError('Captura al menos una medición (peso, presión, temperatura o frecuencia)');
      return;
    }

    const sis = payload.presion_sistolica;
    const dia = payload.presion_diastolica;
    if ((sis === null) !== (dia === null)) {
      setError('Para registrar la presión captura ambos valores (sistólica y diastólica)');
      return;
    }

    setGuardando(true);
    try {
      await signosApi.crear(pacienteId, payload);
      navigation.goBack();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar el registro'));
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
        <SelectorFecha etiqueta="Fecha del registro" valor={form.fecha} onCambiar={set('fecha')} />

        <View style={styles.fila}>
          <Campo
            etiqueta="Peso (kg)"
            placeholder="75"
            value={form.peso}
            onChangeText={set('peso')}
            keyboardType="decimal-pad"
            contenedorStyle={{ flex: 1 }}
          />
          <Campo
            etiqueta="Estatura (m)"
            placeholder="1.75"
            value={form.estatura}
            onChangeText={set('estatura')}
            keyboardType="decimal-pad"
            contenedorStyle={{ flex: 1 }}
          />
        </View>

        <View style={styles.fila}>
          <Campo
            etiqueta="Presión sistólica"
            placeholder="120"
            value={form.presion_sistolica}
            onChangeText={set('presion_sistolica')}
            keyboardType="number-pad"
            contenedorStyle={{ flex: 1 }}
          />
          <Campo
            etiqueta="Presión diastólica"
            placeholder="80"
            value={form.presion_diastolica}
            onChangeText={set('presion_diastolica')}
            keyboardType="number-pad"
            contenedorStyle={{ flex: 1 }}
          />
        </View>

        <View style={styles.fila}>
          <Campo
            etiqueta="Temperatura (°C)"
            placeholder="36.5"
            value={form.temperatura}
            onChangeText={set('temperatura')}
            keyboardType="decimal-pad"
            contenedorStyle={{ flex: 1 }}
          />
          <Campo
            etiqueta="Frec. cardiaca (lpm)"
            placeholder="72"
            value={form.frecuencia_cardiaca}
            onChangeText={set('frecuencia_cardiaca')}
            keyboardType="number-pad"
            contenedorStyle={{ flex: 1 }}
          />
        </View>

        <Campo
          etiqueta="Observaciones (opcional)"
          placeholder="Paciente estable"
          value={form.notas}
          onChangeText={set('notas')}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Boton titulo="Guardar registro" onPress={guardar} cargando={guardando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 18, paddingBottom: 48 },
  fila: { flexDirection: 'row', gap: 12 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
});
