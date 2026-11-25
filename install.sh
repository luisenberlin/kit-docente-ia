#!/usr/bin/env bash
# ==============================================================================
# Kit Docente con IA — Script de Instalación y Verificación de Dependencias
# ==============================================================================
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false

if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 [MODO SIMULACIÓN / DRY-RUN] No se realizarán cambios permanentes."
fi

echo "===================================================================="
echo " 🏫 KIT DOCENTE CON IA — INSTALADOR Y VERIFICADOR DE ENTORNO"
echo "===================================================================="
echo ""

# 1. Comprobar Node.js
echo -n "• Verificando Node.js (necesario para validador y scripts web)... "
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  echo "✅ Encontrado (${NODE_VER})"
else
  echo "⚠️ No encontrado. Recomendado instalar Node.js 18+ para usar los validadores."
fi

# 2. Comprobar Python 3
echo -n "• Verificando Python 3 (necesario para generación de ODTs e informes)... "
if command -v python3 &> /dev/null; then
  PY_VER=$(python3 --version)
  echo "✅ Encontrado (${PY_VER})"
else
  echo "❌ No encontrado. Python 3 es obligatorio para los generadores de exámenes."
  exit 1
fi

# 3. Comprobar python-docx
echo -n "• Verificando librería python-docx... "
if python3 -c "import docx" &> /dev/null; then
  echo "✅ Instalado"
else
  echo "⚠️ No encontrado. Puedes instalarlo con: pip3 install python-docx"
fi

# 4. Comprobar LibreOffice (soffice) para ODT
echo -n "• Verificando LibreOffice (soffice) para exportación ODT... "
if command -v soffice &> /dev/null; then
  echo "✅ Encontrado"
else
  echo "⚠️ No encontrado. Se recomienda instalar LibreOffice para convertir exámenes a .odt"
fi

echo ""
echo "--------------------------------------------------------------------"
echo "📂 Estructura del Kit Docente en: ${REPO_DIR}"
echo "--------------------------------------------------------------------"
echo "  - /web/              Hub web y motor interactivo (study-engine.js)"
echo "  - /normativa/        Tus programaciones didácticas en Markdown"
echo "  - /skills/           Habilidades de IA para crear recursos, exámenes e informes"
echo "  - /examenes/         Salida de exámenes y solucionarios ODT"
echo "  - /informes/         Salida de informes y fichas de refuerzo"
echo "  - /ejemplos/         Caso práctico completo de Física y Química 3º ESO"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "✨ Simulación completada con éxito. El entorno está listo."
else
  echo "🎉 ¡Instalación y verificación completadas!"
  echo ""
  echo "Próximos pasos recomendados:"
  echo "  1. Explora el ejemplo en: cd ${REPO_DIR}/ejemplos"
  echo "  2. Añade tu asignatura en: normativa/"
  echo "  3. Lanza el servidor web local:"
  echo "     python3 -m http.server 8000 --directory web"
  echo "     (abre http://localhost:8000 en tu navegador)"
  echo ""
fi
