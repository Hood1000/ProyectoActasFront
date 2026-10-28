/**
 * Preferencias de vista que deben sobrevivir al salir y volver a una pantalla (p. ej. la
 * pestaña elegida al ir a la sesión de una reunión y regresar). Se guardan en sessionStorage,
 * así duran mientras la pestaña del navegador esté abierta. Si el almacenamiento no está
 * disponible (modo privado, bloqueado), se usa el valor por defecto sin fallar.
 */
export const readSessionPreference = (key, allowedValues, fallback) => {
  try {
    const value = window.sessionStorage.getItem(key);
    return allowedValues.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const writeSessionPreference = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento la vista simplemente vuelve al valor por defecto.
  }
};
