/**
 * Demo Scripts for simulating emergency call scenarios
 * 
 * Each script contains:
 * - transcriptFragments: Array of text fragments to send sequentially (simulates live transcription)
 * - extractionSteps: Array of field extractions with configurable delays (simulates AI processing)
 */

export interface DemoScript {
  name: string;
  description: string;
  transcriptFragments: string[];
  extractionSteps: {
    field: string;
    value: string | number;
    delayMs: number;
  }[];
}

/**
 * Timed Demo Script - for fully automated playback
 * Each segment has a start time (when to start showing) and the text appears word by word
 */
export interface TimedSegment {
  startMs: number;      // When to start showing this text (ms from button press)
  durationMs: number;   // How long to show the text word by word
  text: string;         // The text to display
}

export interface TimedExtraction {
  startMs: number;      // When to extract this field
  field: string;
  value: string | number;
}

export interface TimedDemoScript {
  name: string;
  description: string;
  segments: TimedSegment[];
  extractions: TimedExtraction[];
}

/**
 * Fernando Smith Demo - Exact timestamps from video
 * Base time: 1 second delay after button press
 * 
 * Timeline (adjusted from original -9s):
 * t=1s → t=8s: First text
 * t=12s → t=16s: Second text  
 * t=20s → t=23s: Third text
 * t=40s → t=43s: Fourth text
 */
export const TIMED_DEMO_FERNANDO: TimedDemoScript = {
  name: "Fernando Smith (Auto)",
  description: "Demo automatizado con timestamps exactos - Urgencia por desmayo",
  segments: [
    {
      startMs: 2000,   // t=2s (start after 2 seconds)
      durationMs: 7000, // 7 seconds to show word by word
      text: "Hola, soy Fernando Smith, y estoy llamando porque tengo una urgencia. Me siento muy mal. Siento que me voy a desmayar en cualquier momento.",
    },
    {
      startMs: 12000,  // t=12s
      durationMs: 4000, // 4 seconds
      text: "Sí, estoy en Los Leones 100, en Providencia.",
    },
    {
      startMs: 20000,  // t=20s
      durationMs: 3000, // 3 seconds
      text: "Cerca de un parque de entretenimiento y un bar.",
    },
    {
      startMs: 40000,  // t=40s
      durationMs: 3000, // 3 seconds
      text: "He estado tomando antihistamínico y soy alérgico al maní.",
    },
  ],
  extractions: [
    // Extract after each relevant segment with small delays
    { startMs: 9000, field: "firstName", value: "Fernando" },
    { startMs: 10000, field: "lastName", value: "Smith" },
    { startMs: 11000, field: "consciousness", value: "Alerta" },
    { startMs: 17000, field: "address", value: "Los Leones 100" },
    { startMs: 18000, field: "district", value: "Providencia" },
    { startMs: 24000, field: "reference", value: "Cerca de centro comercial y bar" },
    { startMs: 44000, field: "currentMedications", value: "Antihistamínico" },
    { startMs: 45000, field: "allergies", value: "Maní" },
    { startMs: 46000, field: "description", value: "Urgencia - sensación de desmayo" },
    { startMs: 47000, field: "breathing", value: "Sí" },
    { startMs: 48000, field: "avdi", value: "Alerta" },
  ],
};

export const TIMED_DEMO_SCRIPTS: TimedDemoScript[] = [
  TIMED_DEMO_FERNANDO,
];

/**
 * Default demo script - Elderly fall scenario
 * This is a typical emergency call for a fall with hip pain
 */
export const DEMO_SCRIPT_ELDERLY_FALL: DemoScript = {
  name: "Caída de Adulto Mayor",
  description: "Hombre de 72 años con caída y dolor de cadera",
  transcriptFragments: [
    "Emergencia, ¿en qué puedo ayudarle?",
    "Mi esposo se cayó y no puede levantarse. Tiene mucho dolor en la cadera.",
    "Entiendo señora, mantenga la calma. ¿Cuál es su dirección?",
    "Estamos en Avenida Providencia 1234, departamento 502.",
    "¿Su esposo está consciente? ¿Puede hablar con usted?",
    "Sí, está consciente pero le duele mucho moverse.",
    "¿Respira con normalidad?",
    "Sí, respira bien pero se queja del dolor.",
    "¿Tiene alguna condición médica o toma medicamentos?",
    "Tiene diabetes y toma metformina. También es alérgico a la penicilina.",
    "Perfecto, estamos enviando una ambulancia. ¿Cuál es el nombre de su esposo?",
    "Se llama Juan Pérez, tiene 72 años.",
  ],
  extractionSteps: [
    { field: "firstName", value: "Juan", delayMs: 1500 },
    { field: "lastName", value: "Pérez", delayMs: 1200 },
    { field: "patientAge", value: 72, delayMs: 1000 },
    { field: "patientSex", value: "M", delayMs: 800 },
    { field: "address", value: "Avenida Providencia 1234", delayMs: 1500 },
    { field: "apartment", value: "502", delayMs: 1000 },
    { field: "district", value: "Providencia", delayMs: 1200 },
    { field: "consciousness", value: "Consciente", delayMs: 1000 },
    { field: "breathing", value: "Normal", delayMs: 1000 },
    { field: "avdi", value: "Alerta", delayMs: 800 },
    { field: "medicalHistory", value: "Diabetes", delayMs: 1200 },
    { field: "currentMedications", value: "Metformina", delayMs: 1000 },
    { field: "allergies", value: "Penicilina", delayMs: 1000 },
    { field: "description", value: "Caída con dolor en cadera", delayMs: 1500 },
  ],
};

/**
 * Cardiac emergency script
 */
export const DEMO_SCRIPT_CARDIAC: DemoScript = {
  name: "Emergencia Cardíaca",
  description: "Mujer con dolor torácico y dificultad respiratoria",
  transcriptFragments: [
    "Central de emergencias, ¿cuál es su emergencia?",
    "Mi madre tiene un dolor fuerte en el pecho y le cuesta respirar.",
    "Entiendo, ¿cuántos años tiene su madre?",
    "Tiene 65 años. Está muy pálida y sudando.",
    "¿Está consciente en este momento?",
    "Sí, pero está muy asustada y dice que el dolor se le va al brazo izquierdo.",
    "¿Tiene alguna enfermedad del corazón o toma medicamentos?",
    "Sí, tiene hipertensión y toma aspirina y enalapril.",
    "¿Cuál es la dirección exacta?",
    "Calle Los Alerces 567, casa esquina con Los Aromos, en Las Condes.",
    "¿Cuál es el nombre de su madre?",
    "María González. Por favor, apúrense.",
  ],
  extractionSteps: [
    { field: "firstName", value: "María", delayMs: 1500 },
    { field: "lastName", value: "González", delayMs: 1200 },
    { field: "patientAge", value: 65, delayMs: 1000 },
    { field: "patientSex", value: "F", delayMs: 800 },
    { field: "address", value: "Calle Los Alerces 567", delayMs: 1500 },
    { field: "reference", value: "Esquina con Los Aromos", delayMs: 1200 },
    { field: "district", value: "Las Condes", delayMs: 1000 },
    { field: "consciousness", value: "Consciente pero agitada", delayMs: 1200 },
    { field: "breathing", value: "Dificultad respiratoria", delayMs: 1200 },
    { field: "avdi", value: "Alerta", delayMs: 800 },
    { field: "respiratoryStatus", value: "Disnea moderada", delayMs: 1000 },
    { field: "medicalHistory", value: "Hipertensión arterial", delayMs: 1200 },
    { field: "currentMedications", value: "Aspirina, Enalapril", delayMs: 1000 },
    { field: "vitalSigns", value: "Pálida, sudorosa, dolor irradiado a brazo izquierdo", delayMs: 1500 },
    { field: "description", value: "Dolor torácico con irradiación a brazo izquierdo, disnea", delayMs: 1500 },
  ],
};

/**
 * Traffic accident script
 */
export const DEMO_SCRIPT_ACCIDENT: DemoScript = {
  name: "Accidente de Tránsito",
  description: "Colisión vehicular con lesionado atrapado",
  transcriptFragments: [
    "Emergencias, ¿en qué podemos ayudarle?",
    "Hubo un choque entre dos autos en la Alameda con San Antonio. Hay una persona atrapada.",
    "¿Cuántas personas están heridas?",
    "Veo al menos dos personas heridas. Una está consciente pero atrapada en el auto.",
    "¿La persona atrapada está hablando?",
    "Sí, está consciente, dice que le duele mucho el cuello y las piernas.",
    "¿Puede ver si hay sangre o alguna herida visible?",
    "Tiene un corte en la frente que está sangrando, pero está hablando coherentemente.",
    "¿Sabe el nombre de la persona?",
    "Me dice que se llama Carlos Muñoz, tiene 35 años.",
    "Ya enviamos unidades de rescate. No muevan a los heridos.",
  ],
  extractionSteps: [
    { field: "firstName", value: "Carlos", delayMs: 1500 },
    { field: "lastName", value: "Muñoz", delayMs: 1200 },
    { field: "patientAge", value: 35, delayMs: 1000 },
    { field: "patientSex", value: "M", delayMs: 800 },
    { field: "address", value: "Alameda con San Antonio", delayMs: 1500 },
    { field: "district", value: "Santiago Centro", delayMs: 1200 },
    { field: "consciousness", value: "Consciente y orientado", delayMs: 1200 },
    { field: "breathing", value: "Normal", delayMs: 1000 },
    { field: "avdi", value: "Alerta", delayMs: 800 },
    { field: "vitalSigns", value: "Herida en frente sangrando", delayMs: 1200 },
    { field: "description", value: "Accidente vehicular, paciente atrapado con dolor cervical y en extremidades", delayMs: 1800 },
    { field: "requiredResources", value: "Ambulancia + Rescate vehicular", delayMs: 1200 },
  ],
};

/**
 * All available demo scripts
 */
export const DEMO_SCRIPTS: DemoScript[] = [
  DEMO_SCRIPT_ELDERLY_FALL,
  DEMO_SCRIPT_CARDIAC,
  DEMO_SCRIPT_ACCIDENT,
];

/**
 * Get the default demo script
 */
export function getDefaultDemoScript(): DemoScript {
  return DEMO_SCRIPT_ELDERLY_FALL;
}

