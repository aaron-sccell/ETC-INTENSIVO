import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useTema } from '../context/ThemeContext';
import { aDate } from '../utils/format';

/**
 * Gráfica de líneas para el historial de signos vitales.
 * Dibuja una serie por cada entrada de `series` sobre una escala compartida.
 *
 * @param {{nombre: string, color: string, datos: number[]}[]} series
 * @param {string[]} etiquetas  Etiquetas del eje X (una por punto)
 */
export default function GraficaLinea({ series = [], etiquetas = [], alto = 190 }) {
  const { tema } = useTema();

  const ancho = 320;
  const padIzq = 34;
  const padDer = 10;
  const padArriba = 12;
  const padAbajo = 26;

  const areaAncho = ancho - padIzq - padDer;
  const areaAlto = alto - padArriba - padAbajo;

  const { min, max, puntosPorSerie, lineasY } = useMemo(() => {
    const valores = series.flatMap((s) => s.datos.filter((v) => Number.isFinite(v)));

    if (valores.length === 0) {
      return { min: 0, max: 1, puntosPorSerie: [], lineasY: [] };
    }

    let minimo = Math.min(...valores);
    let maximo = Math.max(...valores);
    const margen = (maximo - minimo) * 0.2 || Math.max(maximo * 0.1, 5);
    minimo = Math.floor(minimo - margen);
    maximo = Math.ceil(maximo + margen);
    if (maximo === minimo) maximo = minimo + 1;

    const totalPuntos = Math.max(...series.map((s) => s.datos.length), 1);
    const paso = totalPuntos > 1 ? areaAncho / (totalPuntos - 1) : 0;

    const escalaY = (v) => padArriba + areaAlto - ((v - minimo) / (maximo - minimo)) * areaAlto;

    const porSerie = series.map((s) => ({
      ...s,
      puntos: s.datos.map((v, i) => ({
        x: padIzq + (totalPuntos > 1 ? i * paso : areaAncho / 2),
        y: Number.isFinite(v) ? escalaY(v) : null,
        valor: v,
      })),
    }));

    const pasos = 4;
    const ejes = Array.from({ length: pasos + 1 }, (_, i) => {
      const v = minimo + ((maximo - minimo) / pasos) * i;
      return { valor: Math.round(v), y: escalaY(v) };
    });

    return { min: minimo, max: maximo, puntosPorSerie: porSerie, lineasY: ejes };
  }, [series, areaAncho, areaAlto]);

  if (puntosPorSerie.length === 0) {
    return (
      <View style={[styles.vacio, { height: alto }]}>
        <Text style={{ color: tema.textoSuave, fontSize: 13 }}>
          Aún no hay registros para graficar
        </Text>
      </View>
    );
  }

  const construirPath = (puntos) => {
    const validos = puntos.filter((p) => p.y !== null);
    if (validos.length === 0) return '';
    return validos
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  };

  return (
    <View>
      {/* Leyenda */}
      <View style={styles.leyenda}>
        {series.map((s) => (
          <View key={s.nombre} style={styles.leyendaItem}>
            <View style={[styles.leyendaPunto, { backgroundColor: s.color }]} />
            <Text style={{ color: tema.textoSuave, fontSize: 11.5, fontWeight: '600' }}>
              {s.nombre}
            </Text>
          </View>
        ))}
      </View>

      <Svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`}>
        {/* Líneas de referencia y valores del eje Y */}
        {lineasY.map((l) => (
          <React.Fragment key={l.y}>
            <Line
              x1={padIzq}
              y1={l.y}
              x2={ancho - padDer}
              y2={l.y}
              stroke={tema.borde}
              strokeWidth={1}
            />
            <SvgText x={padIzq - 6} y={l.y + 3.5} fontSize="9" fill={tema.textoTenue} textAnchor="end">
              {l.valor}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Series */}
        {puntosPorSerie.map((s) => (
          <React.Fragment key={s.nombre}>
            <Path
              d={construirPath(s.puntos)}
              stroke={s.color}
              strokeWidth={2.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {s.puntos
              .filter((p) => p.y !== null)
              .map((p, i) => (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3.2}
                  fill={s.color}
                  stroke={tema.superficie}
                  strokeWidth={1.5}
                />
              ))}
          </React.Fragment>
        ))}

        {/* Etiquetas del eje X (máximo 4 para que no se encimen) */}
        {etiquetas.map((etiqueta, i) => {
          const total = etiquetas.length;
          const cada = Math.max(1, Math.ceil(total / 4));
          if (i % cada !== 0 && i !== total - 1) return null;

          const paso = total > 1 ? areaAncho / (total - 1) : 0;
          const x = padIzq + (total > 1 ? i * paso : areaAncho / 2);

          return (
            <SvgText
              key={i}
              x={x}
              y={alto - 8}
              fontSize="9"
              fill={tema.textoTenue}
              textAnchor="middle"
            >
              {etiqueta}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

/** Convierte los registros de la API en el formato que espera la gráfica. */
export function prepararSeries(signos, tema) {
  const etiquetas = signos.map((s) => {
    const d = aDate(s.fecha);
    return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
  });

  const series = [
    {
      nombre: 'Peso (kg)',
      color: tema.chart[0],
      datos: signos.map((s) => (s.peso != null ? Number(s.peso) : NaN)),
    },
    {
      nombre: 'Presión (sistólica)',
      color: tema.chart[1],
      datos: signos.map((s) =>
        s.presion_sistolica != null ? Number(s.presion_sistolica) : NaN,
      ),
    },
  ].filter((s) => s.datos.some((v) => Number.isFinite(v)));

  return { series, etiquetas };
}

const styles = StyleSheet.create({
  vacio: { alignItems: 'center', justifyContent: 'center' },
  leyenda: { flexDirection: 'row', gap: 16, marginBottom: 6, justifyContent: 'flex-end' },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaPunto: { width: 8, height: 8, borderRadius: 4 },
});
