import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import { DIAS_CORTOS, MESES, aDate, aISO, fechaCorta, hora12 } from '../utils/format';

/**
 * Selectores hechos 100% en JavaScript (sin módulos nativos extra) para que
 * funcionen sin problemas dentro de Expo Go.
 */

/* -------------------------------------------------------------------------- */
/*  Campo "falso" que abre un modal                                           */
/* -------------------------------------------------------------------------- */
function CampoDisparador({ etiqueta, valor, placeholder, icono, onPress, error }) {
  const { tema } = useTema();
  return (
    <View style={{ marginBottom: 14 }}>
      {etiqueta ? (
        <Text style={[styles.etiqueta, { color: tema.textoSuave }]}>{etiqueta}</Text>
      ) : null}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.disparador,
          {
            backgroundColor: tema.superficie,
            borderColor: error ? tema.peligro : tema.borde,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={{ color: valor ? tema.texto : tema.placeholder, fontSize: 15, flex: 1 }}
          numberOfLines={1}
        >
          {valor || placeholder}
        </Text>
        <Ionicons name={icono} size={18} color={tema.textoTenue} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: tema.peligro }]}>{error}</Text> : null}
    </View>
  );
}

function Hoja({ visible, onCerrar, titulo, children, alto }) {
  const { tema } = useTema();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondoModal} onPress={onCerrar} />
      <View
        style={[
          styles.hoja,
          { backgroundColor: tema.superficie, maxHeight: alto || '75%' },
        ]}
      >
        <View style={styles.hojaHeader}>
          <Text style={[styles.hojaTitulo, { color: tema.texto }]}>{titulo}</Text>
          <Pressable onPress={onCerrar} hitSlop={12}>
            <Ionicons name="close" size={22} color={tema.textoSuave} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Selector de lista (paciente, doctor, estado...)                            */
/* -------------------------------------------------------------------------- */
export function SelectorLista({
  etiqueta,
  placeholder = 'Selecciona una opción',
  opciones = [],
  valor,
  onCambiar,
  error,
  titulo,
}) {
  const { tema } = useTema();
  const [abierto, setAbierto] = useState(false);

  const seleccionada = opciones.find((o) => String(o.valor) === String(valor));

  return (
    <>
      <CampoDisparador
        etiqueta={etiqueta}
        valor={seleccionada?.etiqueta}
        placeholder={placeholder}
        icono="chevron-down"
        onPress={() => setAbierto(true)}
        error={error}
      />

      <Hoja
        visible={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={titulo || etiqueta || 'Selecciona'}
      >
        <FlatList
          data={opciones}
          keyExtractor={(item) => String(item.valor)}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tema.borde }} />
          )}
          renderItem={({ item }) => {
            const activo = String(item.valor) === String(valor);
            return (
              <Pressable
                style={styles.opcion}
                onPress={() => {
                  onCambiar(item.valor);
                  setAbierto(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tema.texto, fontSize: 15, fontWeight: '600' }}>
                    {item.etiqueta}
                  </Text>
                  {item.descripcion ? (
                    <Text style={{ color: tema.textoSuave, fontSize: 12, marginTop: 2 }}>
                      {item.descripcion}
                    </Text>
                  ) : null}
                </View>
                {activo ? (
                  <Ionicons name="checkmark-circle" size={20} color={tema.primario} />
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: tema.textoSuave, padding: 20, textAlign: 'center' }}>
              No hay opciones disponibles
            </Text>
          }
        />
      </Hoja>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Selector de fecha (calendario)                                            */
/* -------------------------------------------------------------------------- */
export function SelectorFecha({ etiqueta = 'Fecha', valor, onCambiar, error, placeholder = 'DD/MM/AAAA' }) {
  const { tema } = useTema();
  const [abierto, setAbierto] = useState(false);
  const base = aDate(valor) || new Date();
  const [mesVisible, setMesVisible] = useState(new Date(base.getFullYear(), base.getMonth(), 1));

  const dias = useMemo(() => {
    const primero = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
    const totalDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
    const huecos = primero.getDay();
    return [...Array(huecos).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];
  }, [mesVisible]);

  const seleccionada = aDate(valor);
  const hoy = new Date();

  const moverMes = (delta) =>
    setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + delta, 1));

  return (
    <>
      <CampoDisparador
        etiqueta={etiqueta}
        valor={valor ? fechaCorta(valor) : ''}
        placeholder={placeholder}
        icono="calendar-outline"
        onPress={() => setAbierto(true)}
        error={error}
      />

      <Hoja visible={abierto} onCerrar={() => setAbierto(false)} titulo="Selecciona la fecha">
        <View style={styles.calHeader}>
          <Pressable onPress={() => moverMes(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={tema.primario} />
          </Pressable>
          <Text style={{ color: tema.texto, fontWeight: '700', fontSize: 15 }}>
            {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
          </Text>
          <Pressable onPress={() => moverMes(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={tema.primario} />
          </Pressable>
        </View>

        <View style={styles.calSemana}>
          {DIAS_CORTOS.map((d, i) => (
            <Text key={i} style={[styles.calDiaSemana, { color: tema.textoTenue }]}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {dias.map((dia, i) => {
            if (dia === null) return <View key={`v${i}`} style={styles.calCelda} />;

            const fecha = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia);
            const esSeleccionada =
              seleccionada && aISO(seleccionada) === aISO(fecha);
            const esHoy = aISO(hoy) === aISO(fecha);

            return (
              <Pressable
                key={dia}
                style={styles.calCelda}
                onPress={() => {
                  onCambiar(aISO(fecha));
                  setAbierto(false);
                }}
              >
                <View
                  style={[
                    styles.calDia,
                    esSeleccionada && { backgroundColor: tema.primario },
                    !esSeleccionada && esHoy && { borderWidth: 1.5, borderColor: tema.primario },
                  ]}
                >
                  <Text
                    style={{
                      color: esSeleccionada ? '#FFF' : tema.texto,
                      fontWeight: esSeleccionada || esHoy ? '700' : '500',
                      fontSize: 14,
                    }}
                  >
                    {dia}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.hoyBoton, { backgroundColor: tema.primarioSuave }]}
          onPress={() => {
            onCambiar(aISO(new Date()));
            setAbierto(false);
          }}
        >
          <Text style={{ color: tema.primario, fontWeight: '700' }}>Hoy</Text>
        </Pressable>
      </Hoja>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Selector de hora                                                          */
/* -------------------------------------------------------------------------- */
const HORAS = Array.from({ length: 24 }, (_, i) => i);
const MINUTOS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function SelectorHora({ etiqueta = 'Hora', valor, onCambiar, error }) {
  const { tema } = useTema();
  const [abierto, setAbierto] = useState(false);

  const [h, m] = String(valor || '09:00').split(':').map(Number);
  const horaActual = Number.isFinite(h) ? h : 9;
  const minutoActual = Number.isFinite(m) ? m : 0;

  const fijar = (hora, minuto) =>
    onCambiar(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`);

  return (
    <>
      <CampoDisparador
        etiqueta={etiqueta}
        valor={valor ? hora12(valor) : ''}
        placeholder="HH:MM"
        icono="time-outline"
        onPress={() => setAbierto(true)}
        error={error}
      />

      <Hoja visible={abierto} onCerrar={() => setAbierto(false)} titulo="Selecciona la hora" alto="60%">
        <View style={styles.horaFila}>
          <View style={styles.horaColumna}>
            <Text style={[styles.horaTitulo, { color: tema.textoSuave }]}>Hora</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {HORAS.map((hora) => {
                const activo = hora === horaActual;
                return (
                  <Pressable
                    key={hora}
                    onPress={() => fijar(hora, minutoActual)}
                    style={[
                      styles.horaItem,
                      activo && { backgroundColor: tema.primarioSuave },
                    ]}
                  >
                    <Text
                      style={{
                        color: activo ? tema.primario : tema.texto,
                        fontWeight: activo ? '700' : '500',
                      }}
                    >
                      {hora12(`${String(hora).padStart(2, '0')}:00`)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.horaColumna}>
            <Text style={[styles.horaTitulo, { color: tema.textoSuave }]}>Minutos</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MINUTOS.map((minuto) => {
                const activo = minuto === minutoActual;
                return (
                  <Pressable
                    key={minuto}
                    onPress={() => fijar(horaActual, minuto)}
                    style={[
                      styles.horaItem,
                      activo && { backgroundColor: tema.primarioSuave },
                    ]}
                  >
                    <Text
                      style={{
                        color: activo ? tema.primario : tema.texto,
                        fontWeight: activo ? '700' : '500',
                      }}
                    >
                      :{String(minuto).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <Pressable
          style={[styles.hoyBoton, { backgroundColor: tema.primario }]}
          onPress={() => setAbierto(false)}
        >
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Listo</Text>
        </Pressable>
      </Hoja>
    </>
  );
}

/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  etiqueta: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  disparador: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radios.md,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  error: { fontSize: 12, marginTop: 4 },

  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  hoja: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    paddingBottom: 28,
  },
  hojaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  hojaTitulo: { fontSize: 16, fontWeight: '700' },

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },

  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  calSemana: { flexDirection: 'row', paddingHorizontal: 12 },
  calDiaSemana: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 6 },
  calCelda: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDia: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  hoyBoton: {
    marginHorizontal: 18,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: radios.md,
    alignItems: 'center',
  },

  horaFila: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, height: 260 },
  horaColumna: { flex: 1 },
  horaTitulo: { fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  horaItem: { paddingVertical: 11, borderRadius: radios.sm, alignItems: 'center' },
});
