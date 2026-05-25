# 🎮 Cozy Night (cozynight.itsmo.xyz)
### *A Real-Time, Open-Source Multiplayer Party Game Platform*

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20%28React%2019%29-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![PartyKit WebSockets](https://img.shields.io/badge/PartyKit-WebSockets-orange?logo=partykit&style=flat-square)](https://partykit.io/)
[![Vercel KV](https://img.shields.io/badge/Vercel_KV-Redis-red?logo=redis&style=flat-square)](https://vercel.com/docs/storage/vercel-kv)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-purple?logo=framer&style=flat-square)](https://www.framer.com/motion/)

Welcome to **Cozy Night** — a modern, gorgeous, and dynamic multiplayer gaming platform designed for group play. Users can create private rooms, invite friends via 4-character codes, customize game decks in real-time, and play highly interactive web games. 

Built with a **Neobrutalistic & Glassmorphic UI**, Cozy Night combines visual excellence with modern architecture (WebSockets, Redis, Next.js Server Actions) to deliver sub-100ms real-time interactions.

---

## ✨ Features & User Experience
*   **Frictionless Join Flow**: Zero password requirements. Create a party, choose a display name/avatar, and instantly share the 4-digit code.
*   **Real-time Synchronization**: Powered by PartyKit (WebSockets), keeping all players' lobbies, states, and scores fully synchronized in real-time.
*   **Isolated Session Rooms**: Dynamically routed sessions (`/[roomCode]`) isolating database records, active player states, and websocket room scopes.
*   **Rich Custom Decks Admin UI**: Room admins can dynamically add, delete, customize, and reset prompt decks in real-time. Changes instantly sync across all active players in the room.
*   **Responsive Premium Styling**: Harmonious HSL colors, smooth interactive gradients, subtle micro-animations (Framer Motion), and responsive layouts perfect for mobile-first gameplay.

---

## 🕹️ The Games
Cozy Night hosts a custom suite of high-engagement party games, each engineered around unique group dynamics:

### 🕵️‍♂️ Heist (*Social Deduction & Trust*)
*   **The Concept**: A high-stakes social deduction challenge. Players are secretly assigned roles: **Crew Members** (loyal operatives) or **Snitches** (traitors).
*   **How it plays**:
    1.  The Leader selects a subset of players for a mission.
    2.  The room votes to approve or reject the selected lineup.
    3.  If approved, chosen operatives privately commit to the heist: Crew members click **Commit**, Snitches can choose to **Sabotage**.
    4.  Missions affect global gauges: **Success Meter** and **Heat Meter**.
    5.  The game culminates in a tense **Accusation Phase** where players must identify and vote to execute the Snitches before the Snitches reach their heat threshold.

### ⚖️ Squad Trial (*Chaos & Humorous Judgment*)
*   **The Concept**: A courtroom simulator where players stand trial for lighthearted, customizable roasts.
*   **How it plays**:
    1.  Every round, a player is randomly chosen as the **Accused** under a specific charge (e.g., *"Leaving dirty dishes right next to the empty dishwasher"*).
    2.  Other players act as **Jurors** and must submit anonymous **Evidence** (humorous, roasting claims about the accused).
    3.  The Accused is given a timed window to write and submit a **Defense**.
    4.  Random **Plot Twists** are introduced (e.g., *Double Jeopardy* doubling points, *Diplomatic Immunity* protecting the accused, or *Switcheroo* swapping the accused with a juror).
    5.  Jurors vote **Guilty** or **Not Guilty** to distribute points.

### 🕵️‍♀️ Saboteur (*Association & Deduction*)
*   **The Concept**: A word-association game with an imposter trying to blend in.
*   **How it plays**:
    1.  Most players receive a specific prompt/question.
    2.  One player is secretly chosen as the **Saboteur** and receives a modified, vague prompt.
    3.  Everyone submits their answers. The Saboteur must read the room and submit a blending answer to avoid exposure.
    4.  Players discuss and vote on who the Saboteur is.

### ⚡ Rapid Fire (*High-Speed Trivia*)
*   **The Concept**: A speed-based trivia battle.
*   **How it plays**:
    1.  Players are presented with multiple-choice questions.
    2.  Points are rewarded based on correctness *and* speed.
    3.  A live leaderboard dynamically shifts after each question.

### 👑 Shotcaller (*Tactical Scoring Events*)
*   **The Concept**: A turn-based strategy game using action cards to steal points, swap scores, or protect allies.
*   **How it plays**:
    1.  One player becomes the **Shotcaller** and draws action cards (e.g., *Tax Collector*, *Russian Roulette*, *Alliance*, *Reverse Card*).
    2.  They choose targets and execute events that swing the leaderboard.
    3.  Players can defend themselves using acquired item tokens (like *Shields*).

### 👆 Most Likely To & 💬 Lie Rate
*   **Most Likely To**: Classic voting game pointing out who is most likely to commit a specific blunder.
*   **Lie Rate**: Guessing game where players predict how many people in the room have done a specific embarrassing act.

---

## 🛠️ The Tech Stack
*   **Frontend**: Next.js 16 (App Router, Turbopack, React 19)
*   **Real-time Socket Server**: PartyKit (Cloudflare Workers platform hosting WebSocket state machines)
*   **Database & Cache**: Upstash Redis / Vercel KV REST API
*   **Session Management**: `iron-session` (secure, stateless, encrypted cookie-based user sessions)
*   **Animations**: Framer Motion
*   **CSS**: Tailwind CSS

---

## 🏗️ Architecture & Engineering Highlights
This codebase was designed to highlight clean coding practices, modern distributed systems, and real-time state synchronization:

### 1. Unified Real-Time Synchronization (PartyKit)
Instead of polling databases or managing complex client-side socket reconciliation, the app implements a **WebSockets State Machine** in `party/main.ts`. PartyKit acts as the absolute source of truth. When a user submits an action, it is sent to PartyKit, validated, and broadcasted as a synchronized state snapshot to all connected client sockets in the room.

### 2. Upstash Redis / Vercel KV Custom Decks Storage
To support room isolation and real-time customization without complex SQL overhead, the application stores data using prefixed KV pairs (e.g., `room:ABCD:settings`, `room:ABCD:rsvp`). When the PartyKit room starts, it dynamically fetches the customized prompts from the Redis REST API:
```typescript
async fetchCustomPrompts() {
  const url = `${this.party.env.KV_REST_API_URL}/get/room:${this.roomCode}:prompts`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${this.party.env.KV_REST_API_TOKEN}` }
  });
  // Safely parses and applies custom decks dynamically...
}
```

### 3. Iron-Session Encryption & Room Scopes
User authentication is entirely stateless and secure, utilizing dynamic multi-room cookie session dictionaries. The helper `getRoomSession` refines session states per room, allowing players to login as host, admin, or player in separate rooms simultaneously without cookie clashing.

### 4. End-to-End Type Safety
Strict TypeScript compilation verification is enforced across the entire codebase. Interfaces and type constraints are shared and aligned between Next.js Server Actions, WebSockets payload structures, DB models, and React components to guarantee robust runtime stability.

### 5. Production Optimization & Scalable Topology
Leverages Next.js Turbopack compiler, static generation boundaries, and dynamic route segmentation. State orchestration is split between serverless endpoints (Next.js Server Actions) and edge-based WebSockets (PartyKit), creating a highly scalable room topology with minimal server overhead.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+ (Bun is highly recommended)
*   An Upstash Redis/Vercel KV database instance

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/mo-christmas.git
    cd mo-christmas
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup**:
    Create a `.env` (or `.env.local`) in the root directory:
    ```env
    # Vercel KV / Upstash Configuration
    KV_REST_API_URL="https://your-upstash-instance-url"
    KV_REST_API_TOKEN="your-upstash-rest-token"
    
    # Iron-Session Secret (Must be 32+ characters)
    SESSION_SECRET="your-32-plus-characters-long-secret"
    ```

4.  **Spin Up Servers**:
    Run Next.js dev server:
    ```bash
    npm run dev
    ```
    In a separate terminal, spin up PartyKit socket server locally:
    ```bash
    npm run dev:party
    ```

5.  **Build for Production**:
    Verify that your setup passes static checks and compiles cleanly:
    ```bash
    npm run build
    ```

---

Developed with 💖. Feel free to explore the code, open PRs, or connect!
