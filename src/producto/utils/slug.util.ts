/**
 * Convierte un string en un slug válido para URLs
 * - Convierte a minúsculas
 * - Remueve tildes y caracteres especiales
 * - Reemplaza espacios y caracteres no válidos por guiones
 * - Remueve guiones duplicados y al inicio/final
 * 
 * @param text - Texto a convertir en slug
 * @returns Slug generado
 * 
 * @example
 * createSlug("OG Black Baby Rose") // "og-black-baby-rose"
 * createSlug("Camiseta Básica 100%") // "camiseta-basica-100"
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase() // Convertir a minúsculas
    .normalize('NFD') // Normalizar para separar caracteres base de diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes, acentos)
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales, mantener letras, números, espacios y guiones
    .trim() // Remover espacios al inicio y final
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}
