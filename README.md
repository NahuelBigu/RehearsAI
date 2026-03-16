## RehearsAI
---

**RehearsAI** is a simulator for difficult, high‑stakes conversations powered by multimodal AI.  
It lets you safely rehearse important moments (asking for a raise, giving tough feedback, break‑ups, negotiations, etc.), exploring different paths and outcomes before the real conversation happens.

Instead of a plain text chat, RehearsAI uses **voice, camera, and an emotional avatar** to capture cues like tone of voice, facial expressions, and body language, and represents the interaction as an **explorable decision tree**.

---

<div align="center">
  <img src="./images/Simulation Alternative.png" alt="RehearsAI simulation" width="100%" />
</div>


## Key features

- **Real conversation simulation**: talk by voice with an agent that plays the role of the other person.
- **Guided scenario setup**:
  - relationship (manager, coworker, friend, partner, etc.),
  - goal of the conversation,
  - personality of the simulated person,
  - difficulty level.
- **Rehearsal Expert**: an assistant that interviews you and automatically builds the full scenario from your answers.
- **Dynamic emotional avatars**:
  - you can upload a photo of the real person,
  - the system generates an avatar with multiple expressions (neutral, happy, angry, impatient, sad, surprised),
  - expressions update according to the emotional state of the conversation.
- **Real‑time multimodal interaction**:
  - voice input and output,
  - camera usage to capture visual signals,
  - natural interruptions (if you start talking, the AI stops its response).
- **Explorable conversation tree**:
  - each message becomes a node in a decision tree,
  - you can **rewind** to any point and reply differently,
  - you can generate **alternative responses** and explore parallel branches,
  - at the end you review the full tree to compare strategies and outcomes.

---

## How the app is built

RehearsAI is designed as a **multimodal agent architecture** that combines real‑time interaction with a structured conversation memory.

- **Frontend**
  - React 19 + TypeScript
  - Vite (build tool)
  - Tailwind CSS 4
  - React Router 7
  - React Flow (`@xyflow/react`) for the conversation tree visualization
  - Motion for animations
  - Lucide React for icons
  - Web Audio API for audio capture and playback
  - MediaStream API for camera input

- **Conversation engine**
  - The conversation is stored as an **in‑memory graph** in React state.
  - Each message is a node, enabling:
    - branching conversation paths,
    - rewinding to previous points,
    - exploring alternative endings.

- **Multimodal perception layer**
  - Processes:
    - voice tone and intensity,
    - facial expressions,
    - posture and body language (via camera),
    - communication style.
  - These signals influence:
    - how the agent responds,
    - which expression the avatar shows,
    - where the conversation goes next.

- **AI persona generation**
  - The user defines a personality and uploads a photo of the person to simulate.
  - Using **Google Gemini**, the system generates:
    - avatars with different emotions,
    - gender detection to choose an appropriate voice.
  - This creates a consistent AI persona in tone, style, and behavior.

- **Tech stack (summary)**
  - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, React Flow, Motion, Lucide React.
  - **AI:** Google Gemini API — Live voice (`gemini-2.5-flash-native-audio-preview`), image generation (`gemini-3.1-flash-image-preview`), text/voice (`gemini-3-flash-preview`).
  - **Web runtime:** Web Audio API, MediaStream API, Gemini Live API for multimodal streaming.
  - **State:** in‑memory conversation graph (React Context), no backend persistence.

---

## Requirements to run the app

- **Node.js** (recommended: recent LTS, for example ≥ 20).
- A **Google Gemini** API key with access to:
  - Gemini Live / audio,
  - image generation,
  - text models.

---

## Environment configuration

1. Create a `.env.local` file in the project root (next to `package.json`).
2. Define your Gemini key:

   ```bash
   GEMINI_API_KEY=your_gemini_key_here
   ```

3. Save the file. Vite will load these variables at runtime.

---

## Local installation and development

From the project root (`RehearsAI`):

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. Open in your browser the URL printed by Vite (by default it’s usually `http://localhost:3000`).

---

## Available scripts

From the project root:

- **`npm run dev`**: starts the Vite development server on `0.0.0.0:3000`.
- **`npm run build`**: builds the production bundle into the `dist` folder.
- **`npm run preview`**: serves the production build locally for testing.
- **`npm run clean`**: removes the `dist` folder.
- **`npm run lint`**: runs TypeScript (`tsc --noEmit`) for type checking.

---

## Use cases and applications

Some contexts where RehearsAI can provide value:

- **Leadership skills training**: rehearse difficult conversations with team members.
- **HR training**: simulate complex interviews, performance feedback, and sensitive conversations.
- **Negotiations**: explore different strategies before important negotiations.
- **Therapeutic or personal preparation**: practice emotional or delicate conversations with people close to you.

---

## Future vision

Some natural directions for the project:

- **Communication coaching**:
  - automatic analysis of the conversation tree,
  - feedback on strategies, language, and escalation moments.
- **Training simulators**:
  - integration into leadership, HR, negotiation, and workshop programs.
- **Advanced emotional modeling**:
  - simulation of stress and persuasion dynamics,
  - richer long‑term memory of the relationship between people.

The long‑term goal is for RehearsAI to become a **personal training environment for difficult human conversations**, where it is safe to make mistakes, experiment, and learn.

