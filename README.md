## RehearsAI

<div align="center">
  <img src="./images/Simulation Alternative.png" alt="RehearsAI simulation" width="100%" />
</div>

---

**RehearsAI** es un simulador de conversaciones difíciles impulsado por IA multimodal.  
Te permite practicar conversaciones importantes (subir el sueldo, feedback delicado, rupturas, negociaciones, etc.) en un entorno seguro, explorando distintos caminos y resultados antes de vivir la situación real.

En lugar de limitarse a un chat de texto, RehearsAI usa **voz, cámara y un avatar emocional** para capturar señales como tono de voz, expresiones faciales y lenguaje corporal, y representar la conversación como un **árbol de decisiones explorable**.

---

## Características principales

- **Simulador de conversaciones reales**: habla por voz con un agente que interpreta el papel de la otra persona.
- **Configuración guiada del escenario**:
  - relación (jefe, compañero, amigo, pareja, etc.),
  - objetivo de la conversación,
  - personalidad de la persona simulada,
  - nivel de dificultad.
- **Rehearsal Expert**: asistente que te entrevista y construye automáticamente el escenario completo a partir de tus respuestas.
- **Avatares emocionales dinámicos**:
  - puedes subir una foto de la persona real,
  - el sistema genera un avatar con varias expresiones (neutral, feliz, enfadado, impaciente, triste, sorprendido),
  - las expresiones cambian según el estado emocional de la conversación.
- **Interacción multimodal en tiempo real**:
  - entrada y salida de voz,
  - uso de cámara para captar señales visuales,
  - interrupciones naturales (si empiezas a hablar, la IA corta su respuesta).
- **Árbol de conversación explorable**:
  - cada mensaje es un nodo en un árbol de decisiones,
  - puedes **rebobinar** a cualquier punto y responder de otra forma,
  - puedes generar **respuestas alternativas** y explorar ramas paralelas,
  - al final revisas todo el árbol para comparar estrategias y resultados.

---

## Cómo está construida la app

RehearsAI está diseñada como una **arquitectura de agente multimodal** que combina interacción en tiempo real con una memoria estructurada de la conversación.

- **Frontend**
  - React 19 + TypeScript
  - Vite (build tool)
  - Tailwind CSS 4
  - React Router 7
  - React Flow (`@xyflow/react`) para la visualización del árbol de conversación
  - Motion para animaciones
  - Lucide React para iconografía
  - Web Audio API para captura y reproducción de audio
  - MediaStream API para la cámara

- **Motor de conversación**
  - La conversación se almacena como un **grafo en memoria** en el estado de React.
  - Cada mensaje es un nodo, lo que permite:
    - ramas de conversación,
    - rebobinado a puntos anteriores,
    - exploración de finales alternativos.

- **Capa de percepción multimodal**
  - Procesa:
    - tono e intensidad de voz,
    - expresiones faciales,
    - postura y lenguaje corporal (a través de cámara),
    - estilo de comunicación.
  - Estas señales influyen en:
    - cómo responde el agente,
    - qué expresión muestra el avatar,
    - hacia dónde se dirige la conversación.

- **Generación de persona de IA**
  - El usuario define personalidad y sube una foto de la persona a simular.
  - Con **Google Gemini** se generan:
    - avatares con distintas emociones,
    - detección de género para seleccionar la voz adecuada.
  - Esto construye una persona de IA coherente en tono, estilo y comportamiento.

- **Stack técnico (resumen)**
  - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, React Flow, Motion, Lucide React.
  - **IA:** Google Gemini API — Live voice (`gemini-2.5-flash-native-audio-preview`), generación de imágenes (`gemini-3.1-flash-image-preview`), texto/voz (`gemini-3-flash-preview`).
  - **Runtime web:** Web Audio API, MediaStream API, Gemini Live API para streaming multimodal.
  - **Estado:** grafo de conversación en memoria (React Context), sin persistencia de backend.

---

## Requisitos para levantar la app

- **Node.js** (se recomienda la versión LTS reciente, por ejemplo ≥ 20).
- Una clave de API de **Google Gemini** con acceso a:
  - Gemini Live / audio,
  - generación de imagen,
  - modelos de texto.

---

## Configuración del entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (junto a `package.json`).
2. Define tu clave de Gemini:

   ```bash
   GEMINI_API_KEY=tu_clave_de_gemini_aquí
   ```

3. Guarda el archivo. Vite cargará estas variables en tiempo de ejecución.

---

## Instalación y ejecución en local

En la raíz del proyecto (`RehearsAI`):

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Levantar el entorno de desarrollo**

   ```bash
   npm run dev
   ```

3. Abre en el navegador la URL que te indique Vite (por defecto suele ser `http://localhost:3000`).

---

## Scripts disponibles

Desde la raíz del proyecto:

- **`npm run dev`**: levanta el servidor de desarrollo de Vite en `0.0.0.0:3000`.
- **`npm run build`**: genera el build de producción en la carpeta `dist`.
- **`npm run preview`**: sirve localmente el build de producción para pruebas.
- **`npm run clean`**: elimina la carpeta `dist`.
- **`npm run lint`**: ejecuta TypeScript (`tsc --noEmit`) para comprobar tipos.

---

## Casos de uso e ideas de aplicación

Algunos contextos donde RehearsAI puede aportar valor:

- **Entrenamiento de habilidades de liderazgo**: practicar conversaciones difíciles con miembros del equipo.
- **Formación en RRHH**: simulación de entrevistas complejas, feedback de desempeño, conversaciones sensibles.
- **Negociaciones**: explorar diferentes estrategias antes de negociaciones importantes.
- **Preparación terapéutica o personal**: ensayar conversaciones emocionales o delicadas con personas cercanas.

---

## Visión futura

Algunas direcciones naturales de evolución para el proyecto:

- **Coaching de comunicación**:
  - análisis automático del árbol de conversación,
  - feedback sobre estrategias, lenguaje y momentos de escalada emocional.
- **Simuladores de formación**:
  - integración en programas de liderazgo, RRHH, negociación y talleres.
- **Modelado emocional avanzado**:
  - simulación de dinámicas de estrés y persuasión,
  - mayor memoria a largo plazo de la relación entre personas.

El objetivo a largo plazo es que RehearsAI se convierta en un **entorno personal de entrenamiento para conversaciones humanas difíciles**, donde sea seguro equivocarse, probar, y aprender.

