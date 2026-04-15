# Conference Game — Who Wants to Be a Reinventor?

A live game show app built for conferences and events. Inspired by *Who Wants to Be a Millionaire*, it runs across two browser windows: an **Admin Panel** for the host and a **Screen** for the audience display.

---

## How It Works

The game runs in three phases:

**1. Wheel Phase**
The host spins a wheel up to 5 times to randomly select contestants from the audience. The screen displays the spinning wheel live. Once all 5 players are selected, the host moves to the next phase.

**2. Selection Phase**
The host picks one of the 5 selected players as the active contestant. The audience screen shows all players with the selected one highlighted.

**3. Quiz Phase**
The contestant answers multiple-choice questions through an escalating prize ladder. The host controls the pace:
- Records the player's answer (A/B/C/D) on the admin panel
- Reveals the correct answer when ready
- Advances to the next question or eliminates the contestant

Lifelines (50:50, Skip, Ask a Colleague) are available and tracked on both screens.

---

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/) — shared game state
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) — real-time sync between admin and screen tabs

---

## Getting Started

```bash
npm install
npm run dev
```

Then open two browser windows:

| Window | URL |
|--------|-----|
| Admin Panel | `http://localhost:3000/admin` |
| Audience Screen | `http://localhost:3000/screen` |

Both windows must be open in the **same browser** on the same machine for the BroadcastChannel sync to work.

---

## Project Structure

```
app/
  admin/page.tsx      # Host control panel
  screen/page.tsx     # Audience display
components/
  SpinningWheel.tsx   # Animated wheel component
store/
  gameStore.ts        # Zustand store + all game logic
hooks/
  useBroadcastSync.ts # Cross-tab state sync
data/
  mockData.ts         # Players, questions, prize ladder
```

---

## Customisation

**Players** — edit `ALL_PLAYERS` in `data/mockData.ts`

**Questions** — edit the `QUESTIONS` array in `data/mockData.ts`. Each question needs:
```ts
{
  text: "Your question here?",
  answers: ["A", "B", "C", "D"],
  correct: 0  // index of the correct answer
}
```

**Prize ladder** — edit `PRIZE_LADDER` in `data/mockData.ts`

**Safe levels** — edit `SAFE_LEVELS` (set of indices the contestant keeps if eliminated above them)
