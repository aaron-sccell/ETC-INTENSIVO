import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';

/* -------------------------------------------------------------------------- */
/*  Tarjeta                                                                   */
/* -------------------------------------------------------------------------- */
export function Tarjeta({ children, style, onPress, ...rest }) {
  const { tema } = useTema();
  const base = [
    styles.tarjeta,
    { backgroundColor: tema.superficie, borderColor: tema.borde },
    sombraTarjeta(tema),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...base, pressed && { opacity: 0.75 }]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Botón                                                                     */
/* -------------------------------------------------------------------------- */
export function Boton({
  titulo,
  onPress,
  variante = 'primario', // primario | secundario | texto | peligro
  icono,
  cargando = false,
  deshabilitado = false,
  style,
  textStyle,
}) {
  const { tema } = useTema();
  const inactivo = deshabilitado || cargando;

  const estilos = {
    primario: { fondo: tema.primario, texto: '#FFFFFF', borde: tema.primario },
    secundario: { fondo: tema.primarioSuave, texto: tema.primario, borde: tema.primarioSuave },
    texto: { fondo: 'transparent', texto: tema.primario, borde: 'transparent' },
    peligro: { fondo: 'transparent', texto: tema.peligro, borde: tema.peligro },
  }[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: estilos.fondo,
          borderColor: estilos.borde,
          opacity: inactivo ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={estilos.texto} />
      ) : (
        <View style={styles.botonContenido}>
          {icono ? <Ionicons name={icono} size={18} color={estilos.texto} /> : null}
          <Text style={[styles.botonTexto, { color: estilos.texto }, textStyle]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Campo de texto                                                            */
/* -------------------------------------------------------------------------- */
export function Campo({
  etiqueta,
  icono,
  error,
  style,
  contenedorStyle,
  iconoDerecho,
  onPressIconoDerecho,
  ...props
}) {
  const { tema } = useTema();

  return (
    <View style={[styles.campoContenedor, contenedorStyle]}>
      {etiqueta ? (
        <Text style={[styles.etiqueta, { color: tema.textoSuave }]}>{etiqueta}</Text>
      ) : null}

      <View
        style={[
          styles.campo,
          {
            backgroundColor: tema.superficie,
            borderColor: error ? tema.peligro : tema.borde,
          },
        ]}
      >
        {icono ? (
          <Ionicons name={icono} size={18} color={tema.textoTenue} style={styles.campoIcono} />
        ) : null}

        <TextInput
          placeholderTextColor={tema.placeholder}
          style={[styles.campoInput, { color: tema.texto }, style]}
          {...props}
        />

        {iconoDerecho ? (
          <Pressable onPress={onPressIconoDerecho} hitSlop={10}>
            <Ionicons name={iconoDerecho} size={20} color={tema.textoTenue} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: tema.peligro }]}>{error}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Etiqueta de estado (Confirmada / Pendiente / ...)                          */
/* -------------------------------------------------------------------------- */
export function Etiqueta({ texto, color = 'primario', style }) {
  const { tema } = useTema();

  const paleta = {
    primario: [tema.primarioSuave, tema.primario],
    exito: [tema.exitoSuave, tema.exito],
    aviso: [tema.avisoSuave, tema.aviso],
    peligro: [tema.peligroSuave, tema.peligro],
    neutro: [tema.superficieAlt, tema.textoSuave],
  }[color] || [tema.primarioSuave, tema.primario];

  return (
    <View style={[styles.etiquetaChip, { backgroundColor: paleta[0] }, style]}>
      <Text style={[styles.etiquetaChipTexto, { color: paleta[1] }]}>{texto}</Text>
    </View>
  );
}

/** Traduce el estado de una cita al color de la etiqueta. */
export function colorEstado(estado) {
  return (
    {
      confirmada: 'exito',
      pendiente: 'aviso',
      cancelada: 'peligro',
      completada: 'neutro',
    }[estado] || 'neutro'
  );
}

/* -------------------------------------------------------------------------- */
/*  Estados: cargando / error / vacío                                          */
/* -------------------------------------------------------------------------- */
export function Cargando({ texto = 'Cargando...', style }) {
  const { tema } = useTema();
  return (
    <View style={[styles.centro, style]}>
      <ActivityIndicator size="large" color={tema.primario} />
      <Text style={[styles.centroTexto, { color: tema.textoSuave }]}>{texto}</Text>
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  const { tema } = useTema();
  return (
    <View style={styles.centro}>
      <View style={[styles.iconoCirculo, { backgroundColor: tema.peligroSuave }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={tema.peligro} />
      </View>
      <Text style={[styles.centroTitulo, { color: tema.texto }]}>Algo salió mal</Text>
      <Text style={[styles.centroTexto, { color: tema.textoSuave }]}>{mensaje}</Text>
      {onReintentar ? (
        <Boton
          titulo="Reintentar"
          icono="refresh"
          variante="secundario"
          onPress={onReintentar}
          style={{ marginTop: 16, paddingHorizontal: 24 }}
        />
      ) : null}
    </View>
  );
}

export function EstadoVacio({ icono = 'file-tray-outline', titulo, texto, accion }) {
  const { tema } = useTema();
  return (
    <View style={styles.centro}>
      <View style={[styles.iconoCirculo, { backgroundColor: tema.primarioSuave }]}>
        <Ionicons name={icono} size={30} color={tema.primario} />
      </View>
      {titulo ? <Text style={[styles.centroTitulo, { color: tema.texto }]}>{titulo}</Text> : null}
      {texto ? <Text style={[styles.centroTexto, { color: tema.textoSuave }]}>{texto}</Text> : null}
      {accion}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fila de información (etiqueta + valor con icono)                          */
/* -------------------------------------------------------------------------- */
export function FilaInfo({ icono, etiqueta, valor, ultima = false }) {
  const { tema } = useTema();
  return (
    <View
      style={[
        styles.filaInfo,
        !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tema.borde },
      ]}
    >
      <View style={styles.filaInfoIzq}>
        <Ionicons name={icono} size={17} color={tema.textoTenue} />
        <Text style={[styles.filaInfoEtiqueta, { color: tema.textoSuave }]}>{etiqueta}</Text>
      </View>
      <Text style={[styles.filaInfoValor, { color: tema.texto }]} numberOfLines={2}>
        {valor || '—'}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tabs simples                                                              */
/* -------------------------------------------------------------------------- */
export function Tabs({ opciones, activo, onCambiar, style }) {
  const { tema } = useTema();
  return (
    <View style={[styles.tabs, { backgroundColor: tema.superficieAlt }, style]}>
      {opciones.map((op) => {
        const seleccionado = op.valor === activo;
        return (
          <Pressable
            key={op.valor}
            onPress={() => onCambiar(op.valor)}
            style={[
              styles.tab,
              seleccionado && { backgroundColor: tema.primario },
            ]}
          >
            <Text
              style={[
                styles.tabTexto,
                { color: seleccionado ? '#FFFFFF' : tema.textoSuave },
              ]}
              numberOfLines={1}
            >
              {op.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: radios.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  boton: {
    height: 50,
    borderRadius: radios.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  botonContenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonTexto: { fontSize: 15, fontWeight: '700' },

  campoContenedor: { marginBottom: 14 },
  etiqueta: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radios.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  campoIcono: { marginRight: 8 },
  campoInput: { flex: 1, fontSize: 15, paddingVertical: 12 },
  error: { fontSize: 12, marginTop: 4 },

  etiquetaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radios.full,
    alignSelf: 'flex-start',
  },
  etiquetaChipTexto: { fontSize: 11, fontWeight: '700' },

  centro: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  centroTitulo: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  centroTexto: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  iconoCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  filaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  filaInfoIzq: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  filaInfoEtiqueta: { fontSize: 13.5, fontWeight: '500' },
  filaInfoValor: { fontSize: 13.5, fontWeight: '600', flex: 1, textAlign: 'right' },

  tabs: { flexDirection: 'row', borderRadius: radios.md, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTexto: { fontSize: 13, fontWeight: '700' },
});
