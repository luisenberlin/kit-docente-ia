/**
 * Recurso de Ejemplo: El Átomo y la Materia (Física y Química 3º ESO)
 * Versión corregida 100% validada para el kit-docente-ia
 */
window.STUDY_DATA = {
  meta: {
    title: "El Átomo y la Materia",
    kicker: "3eso · Física y Química",
    h1: "Estructura de la Materia y el Átomo",
    subject: "Física y Química",
    course: "3eso",
    color: "#0D9488",
    icon: "atom",
    description: "Unidad interactiva completa sobre propiedades de la materia, teoría cinético-molecular, modelos atómicos y tabla periódica."
  },
  CONFIG: {
    key: "atomo-materia-v1",
    temas: [
      { n: 1, name: "Estados de la Materia y Teoría Cinética" },
      { n: 2, name: "Estructura Atómica y Sistema Periódico" }
    ]
  },
  SECS: [
    { id: "1.1", tema: 1, name: "1.1 Propiedades generales y estados de agregación", short: "Estados" },
    { id: "1.2", tema: 1, name: "1.2 Teoría cinético-molecular y leyes de los gases", short: "Gases" },
    { id: "2.1", tema: 2, name: "2.1 Modelos atómicos históricos y partículas subatómicas", short: "Átomos" },
    { id: "2.2", tema: 2, name: "2.2 Isótopos, iones y organización del Sistema Periódico", short: "Tabla" }
  ],
  MCr: [
    ["1.1", "La magnitud física que mide la cantidad de materia de un cuerpo es:", ["La masa", "El volumen", "La densidad", "La temperatura"], "La masa es la medida de la cantidad de materia que posee un cuerpo."],
    ["1.1", "En el estado gaseoso, las partículas:", ["Se mueven libremente a gran velocidad y ocupan todo el recipiente", "Están fijas en posiciones rígidas", "Están muy juntas pero fluyen unas sobre otras", "No tienen energía cinética"], "Los gases tienen partículas con gran energía cinética y ocupan todo el volumen."],
    ["1.2", "Si aumentamos la presión de un gas a temperatura constante, su volumen:", ["Disminuye", "Aumenta", "Permanece invariable", "Se evapora"], "Ley de Boyle-Mariotte: presión y volumen son inversamente proporcionales."],
    ["2.1", "El núcleo del átomo está compuesto por:", ["Protones y neutrones", "Electrones y protones", "Solo electrones", "Neutrones y electrones"], "El núcleo contiene protones (carga positiva) y neutrones."],
    ["2.2", "Un ion positivo o catión se forma cuando un átomo neutro:", ["Pierde electrones", "Gana electrones", "Pierde protones", "Gana neutrones"], "Al perder electrones, queda con carga positiva (catión)."]
  ],
  VFr: [
    ["1.1", "La densidad se calcula dividiendo la masa entre el volumen.", true, "Correcto: d = m / V."],
    ["1.2", "Durante un cambio de estado, la temperatura sigue aumentando continuamente.", false, "Durante los cambios de estado, la temperatura permanece constante."],
    ["2.1", "El número atómico (Z) indica el número total de protones.", true, "Correcto."],
    ["2.2", "Los isótopos son átomos con igual número de protones pero distinto número de neutrones.", true, "Definición oficial de isótopo."]
  ],
  CARDr: [
    ["1.1", "Densidad", "Masa de una sustancia por unidad de volumen (d = m / V)."],
    ["1.2", "Teoría cinético-molecular", "Modelo que explica la materia como partículas en movimiento constante."],
    ["2.1", "Número Másico (A)", "Suma de protones y neutrones del núcleo atómico."],
    ["2.2", "Isótopo", "Átomos con idéntico Z y distinto A (protones/masa)."]
  ],
  OPENr: [
    ["1.1", "¿Por qué un cubito de hielo flota en el agua líquida?", "Porque al solidificarse, el agua forma una estructura que ocupa más volumen, de menor densidad que el agua líquida.", [["estructura", ["estructura"]],["volumen", ["volumen"]],["densidad", ["densidad"]]]],
    ["2.1", "Explica en qué consistió el experimento de la lámina de oro de Rutherford.", "Lámina bombardeada con partículas alfa. La mayoría la atraviesa (átomo casi vacío). Algunas rebotan (núcleo central denso positivo).", [["lámina de oro", ["lámina", "oro"]],["núcleo", ["núcleo"]],["vacío", ["vacío"]],["partículas alfa", ["alfa"]]]]
  ],
  SORTr: [
    ["1.1", "Cambios físicos vs químicos", "Clasifica cada fenómeno:", ["Cambio físico", "Cambio químico"], [["Agua hirviendo",0],["Combustión de papel",1],["Fusión del hielo",0],["Digestión",1]]],
    ["2.2", "Grupos de la tabla periódica", "Clasifica cada elemento:", ["Metal alcalino", "Halógeno"], [["Sodio (Na)",0],["Cloro (Cl)",1],["Litio (Li)",0],["Yodo (I)",1]]]
  ]
};
