/** Utilidades de país (ISO 3166-1 alpha-2) en TypeScript */

/** Mapa de códigos a nombres en español */
export const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', BO: 'Bolivia', BR: 'Brasil', CL: 'Chile', CO: 'Colombia',
  CR: 'Costa Rica', CU: 'Cuba', DO: 'República Dominicana', EC: 'Ecuador', SV: 'El Salvador',
  GT: 'Guatemala', HN: 'Honduras', MX: 'México', NI: 'Nicaragua', PA: 'Panamá',
  PY: 'Paraguay', PE: 'Perú', PR: 'Puerto Rico', UY: 'Uruguay', VE: 'Venezuela',
  ES: 'España', US: 'Estados Unidos', CA: 'Canadá'
};

/** Convierte código de país a emoji de bandera */
export function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode) return '';
  const clean = countryCode.trim().toUpperCase();
  if (clean.length < 2) return '';
  const code = clean.slice(0, 2);
  return String.fromCodePoint(...code.split('').map(c => 127397 + c.charCodeAt(0)));
}

/** Obtiene nombre del país en español o código si no existe */
export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode) return '';
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}

/** Retorna "🇨🇱 Chile" o solo nombre/código */
export function getCountryDisplay(countryCode: string | null | undefined): string {
  const flag = getCountryFlag(countryCode);
  const name = getCountryName(countryCode);
  return flag ? `${flag} ${name}` : name;
}

export default { getCountryFlag, getCountryName, getCountryDisplay, COUNTRY_NAMES };
