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
Cozy Night hosts a custom suite of high-engagement party games, each engineered around unique group dynamics and premium visuals:

### 🕵️‍♂️ Heist (*Cyberpunk Mainframe Wiring*)
*   **The Concept**: A high-stakes social deduction heist. Operatives must override the mainframe security systems while sniffing out the traitors in their squad.
*   **How it plays**:
    1.  Operatives must solve real-time **Wiring Micro-Games** by clicking matching wire colors to override the mainframe before the security timer expires.
    2.  The **Snitch** can privately sabotage missions, trigger active traps on player screens, and increase the room's Heat level.
    3.  Operatives must collaborate, deduce who is hindering progress, and vote them out before the server alarms trigger.

### ⚖️ Squad Trial (*Ace Attorney Courtroom Simulator*)
*   **The Concept**: A fast-paced, high-drama courtroom simulator where players stand trial for humorous, customizable roasts.
*   **How it plays**:
    1.  The **Accused** stands trial under a specific, customizable charge (e.g., *"Leaving dirty dishes right next to the empty dishwasher"*).
    2.  **Jurors** inspect evidence cards from a physical ledger docket (such as burrito receipts, phone logs, or incognito browser history) and slam the **Objection!** button to present roasts.
    3.  Features **Gavel Slams**, comic speed-lines, timed defense rebuttals, and final sentencing verdict stamps.

### 🕵️‍♀️ Saboteur (*Chameleon Word Grid*)
*   **The Concept**: A coordinate-based grid association and deduction game.
*   **How it plays**:
    1.  Players are presented with a 4x4 coordinate word grid (the **Chameleon Grid**). Honest players are given the exact target cell coordinates.
    2.  The **Saboteur** is blind to the target word but must blend in by writing a related clue.
    3.  If players identify and vote out the Saboteur, the Saboteur gets a **last-second clutch Escape guess** to identify the correct target word from the grid and steal the win.

### ⚡ Rapid Fire (*WarioWare Micro-Games*)
*   **The Concept**: A fast-paced, chaotic sequence of mini-challenges that test reflexes, speed, and accuracy.
*   **How it plays**:
    1.  Players must complete a sequence of 5 frantic micro-challenges (tapping target Santas, matching range sliders, avoiding active clicking zones, reverse spelling, and shaking clicking boxes).
    2.  Neon-lit progress tracks show real-time avatar race progress, and points scale dynamically based on milliseconds remaining.

### 👑 Shotcaller (*Tactical Scoring & Chaos Cards*)
*   **The Concept**: A turn-based strategy game using god-mode card hands to steal points, swap scores, or protect allies.
*   **How it plays**:
    1.  The **Shotcaller** draws **Chaos Cards** (Tax Collector, Alliance, Reverse) from a floating 3D-like hand interface.
    2.  Using animated target reticles and crosshairs, they select targets to execute swing events.
    3.  Targets can actively counter attacks by spending acquired skill tokens (like Shields) to trigger block animations.

### 👆 Most Likely To (*Roast & Betting Slip Arena*)
*   **The Concept**: Anonymous roasts combined with point-multiplier betting slips.
*   **How it plays**:
    1.  Players type custom anonymous roasts targeted at specific room members.
    2.  Before votes are revealed, players fill out a betting slip predicting which candidate will win the majority.
    3.  A grid of roasting bubbles is presented, highlighting the funniest and most savage comments.

### 💬 Lie Rate (*Polygraph Heart-Rate Showdown*)
*   **The Concept**: Confession interrogation coupled with biometric telemetry bidding.
*   **How it plays**:
    1.  The Hot Seat player answers confessions on a virtual lie detector terminal.
    2.  Other players analyze a pulsing SVG EKG heart-rate graph representing biometric data.
    3.  Analysts place point bids on whether the statement is a **Fact** or a **Fabrication** before a giant verdict stamp seals the result.

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
