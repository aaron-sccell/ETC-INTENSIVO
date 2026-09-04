/**
 * Paleta y tokens de diseño de la app.
 * Acento morado/índigo, tarjetas redondeadas y tipografía limpia,
 * siguiendo el prototipo de la app.
 */

const acento = {
  primario: '#6C5CE7',
  primarioOscuro: '#5A4BD1',
  primarioSuave: '#EEEBFF',
  exito: '#22C55E',
  exitoSuave: '#DCFCE7',
  aviso: '#F59E0B',
  avisoSuave: '#FEF3C7',
  peligro: '#EF4444',
  peligroSuave: '#FEE2E2',
  info: '#3B82F6',
};

export const temaClaro = {
  modo: 'claro',
  ...acento,
  fondo: '#F6F7FB',
  superficie: '#FFFFFF',
  superficieAlt: '#F1F2F8',
  borde: '#E8E9F1',
  texto: '#1B1D28',
  textoSuave: '#6B7089',
  textoTenue: '#9CA1B5',
  sombra: '#0F172A',
  barra: '#FFFFFF',
  placeholder: '#A8ADC0',
  chart: ['#6C5CE7', '#22C55E'],
};

export const temaOscuro = {
  modo: 'oscuro',
  ...acento,
  primarioSuave: '#2A2352',
  exitoSuave: '#13351F',
  avisoSuave: '#3A2A0B',
  peligroSuave: '#3B1717',
  fondo: '#12131A',
  superficie: '#1C1E28',
  superficieAlt: '#252836',
  borde: '#2E3140',
  texto: '#F3F4F8',
  textoSuave: '#A0A5BC',
  textoTenue: '#727892',
  sombra: '#000000',
  barra: '#1C1E28',
  placeholder: '#6B7089',
  chart: ['#8B7CF6', '#4ADE80'],
};

export const radios = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const espacios = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const tipografia = {
  titulo: { fontSize: 24, fontWeight: '700' },
  subtitulo: { fontSize: 18, fontWeight: '700' },
  seccion: { fontSize: 15, fontWeight: '700' },
  cuerpo: { fontSize: 14, fontWeight: '500' },
  pequeno: { fontSize: 12, fontWeight: '500' },
};

/** Sombra suave y consistente para las tarjetas (iOS + Android). */
export function sombraTarjeta(tema) {
  return {
    shadowColor: tema.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: tema.modo === 'claro' ? 0.06 : 0.3,
    shadowRadius: 8,
    elevation: 2,
  };
}

export default { temaClaro, temaOscuro, radios, espacios, tipografia, sombraTarjeta };
