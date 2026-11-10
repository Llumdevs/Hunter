const CODE_LENGTH = 6;
const GROUP = 3;

// Código corto para que el camarero lo lea en la pantalla de canje (p. ej. "8A0-B5D").
export function redemptionDisplayCode(redemptionId: string): string {
  // Los 8 primeros caracteres de un UUID son hexadecimales, sin guiones.
  const code = redemptionId.slice(0, CODE_LENGTH).toUpperCase();
  return `${code.slice(0, GROUP)}-${code.slice(GROUP)}`;
}
