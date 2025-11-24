/**
 * Generador automático de SKU para variaciones de productos
 * Formato: PRD-{ID}-{COLOR_CODE}-{TALLA}
 * Ejemplo: PRD-123-BLK-M
 */

/**
 * Convierte un color a un código de 3 letras
 */
const getColorCode = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    // Español
    'negro': 'BLK',
    'blanco': 'WHT',
    'rojo': 'RED',
    'azul': 'BLU',
    'verde': 'GRN',
    'amarillo': 'YLW',
    'gris': 'GRY',
    'rosa': 'PNK',
    'morado': 'PRP',
    'naranja': 'ORG',
    'marron': 'BRW',
    'beige': 'BEG',
    'celeste': 'SKY',
    'turquesa': 'TRQ',
    'violeta': 'VLT',
    'fucsia': 'FCS',
    'cafe': 'BRW',
    'dorado': 'GLD',
    'plateado': 'SLV',
    'crema': 'CRM',
    
    // Inglés
    'black': 'BLK',
    'white': 'WHT',
    'red': 'RED',
    'blue': 'BLU',
    'green': 'GRN',
    'yellow': 'YLW',
    'gray': 'GRY',
    'grey': 'GRY',
    'pink': 'PNK',
    'purple': 'PRP',
    'orange': 'ORG',
    'brown': 'BRW',
    'navy': 'NVY',
    'gold': 'GLD',
    'silver': 'SLV',
    'cream': 'CRM',
  };

  const colorLower = color.toLowerCase().trim();
  
  // Buscar coincidencia exacta
  if (colorMap[colorLower]) {
    return colorMap[colorLower];
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(colorMap)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return value;
    }
  }

  // Si no hay coincidencia, tomar las primeras 3 letras en mayúsculas
  return color.substring(0, 3).toUpperCase();
};

/**
 * Convierte una talla a formato estándar
 */
const getSizeCode = (talla: string): string => {
  const sizeUpper = talla.toUpperCase().trim();
  
  // Tallas estándar
  if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(sizeUpper)) {
    return sizeUpper;
  }

  // Tallas numéricas (ej: 32, 34, 36)
  if (/^\d+$/.test(sizeUpper)) {
    return sizeUpper;
  }

  // Otras tallas (tomar primeras 3 letras/números)
  return sizeUpper.substring(0, 3);
};

/**
 * Genera un SKU único para una variación
 * @param productoId ID del producto
 * @param color Color de la variación
 * @param talla Talla de la variación
 * @returns SKU generado (ej: PRD-123-BLK-M)
 */
export const generarSKU = (
  productoId: number,
  color?: string,
  talla?: string
): string => {
  const parts = ['PRD', productoId.toString()];

  if (color) {
    parts.push(getColorCode(color));
  }

  if (talla) {
    parts.push(getSizeCode(talla));
  }

  return parts.join('-');
};

/**
 * Valida si un SKU tiene el formato correcto
 */
export const validarSKU = (sku: string): boolean => {
  // Formato: PRD-{número}-{código}-{talla}
  const regex = /^PRD-\d+(-[A-Z0-9]{1,3})?(-[A-Z0-9]{1,3})?$/;
  return regex.test(sku);
};
