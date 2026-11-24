/**
 * Theme Manager · Luis Lab
 * Sistema de temas compartido (light/dark/auto)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'luislab:theme';
  const THEME_ATTR = 'data-theme';
  
  /**
   * Obtiene el tema preferido del sistema
   */
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  /**
   * Obtiene el tema guardado o el del sistema
   */
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        return saved;
      }
    } catch (error) {
      // localStorage puede estar bloqueado
    }
    return 'auto';
  }
  
  /**
   * Resuelve el tema real (light/dark) según la preferencia
   */
  function resolveTheme(preference) {
    if (preference === 'auto') {
      return getSystemTheme();
    }
    return preference;
  }
  
  /**
   * Aplica el tema al documento
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_ATTR, theme);
  }
  
  /**
   * Guarda la preferencia de tema
   */
  function saveTheme(preference) {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (error) {
      // Ignorar si localStorage no está disponible
    }
  }
  
  /**
   * Inicializa el sistema de temas
   */
  function initTheme() {
    const preference = getSavedTheme();
    const resolved = resolveTheme(preference);
    applyTheme(resolved);
    
    // Escuchar cambios en la preferencia del sistema (solo si auto)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const currentPreference = getSavedTheme();
      if (currentPreference === 'auto') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
    
    return { preference, resolved };
  }
  
  /**
   * Toggle entre temas
   */
  function toggleTheme() {
    const currentPreference = getSavedTheme();
    let newPreference;
    
    // Ciclo: auto → light → dark → auto
    if (currentPreference === 'auto') {
      newPreference = 'light';
    } else if (currentPreference === 'light') {
      newPreference = 'dark';
    } else {
      newPreference = 'auto';
    }
    
    const resolved = resolveTheme(newPreference);
    saveTheme(newPreference);
    applyTheme(resolved);
    
    return { preference: newPreference, resolved };
  }
  
  /**
   * Establece un tema específico
   */
  function setTheme(preference) {
    if (preference !== 'light' && preference !== 'dark' && preference !== 'auto') {
      console.warn(`Invalid theme preference: ${preference}`);
      return;
    }
    
    const resolved = resolveTheme(preference);
    saveTheme(preference);
    applyTheme(resolved);
    
    return { preference, resolved };
  }
  
  /**
   * Obtiene el estado actual del tema
   */
  function getCurrentTheme() {
    const preference = getSavedTheme();
    const resolved = document.documentElement.getAttribute(THEME_ATTR) || resolveTheme(preference);
    return { preference, resolved };
  }
  
  // Aplicar tema antes del primer pintado (inline en cada página)
  // Este script se ejecuta después, solo para interactividad
  
  // API pública
  window.LuisLabTheme = {
    init: initTheme,
    toggle: toggleTheme,
    set: setTheme,
    get: getCurrentTheme
  };
  
  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
