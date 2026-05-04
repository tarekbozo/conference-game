export interface PlayerQuestion {
  id: string;
  playerName: string;
  round: 1 | 2 | 3;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  trapAnswer?: string;
}

export interface Player {
  id: string;
  name: string;
  questions: [PlayerQuestion, PlayerQuestion, PlayerQuestion];
}

export const PLAYERS: Player[] = [
  {
    id: "p1",
    name: "Anna Lindgren",
    questions: [
      { id: "p1q1", playerName: "Anna Lindgren", round: 1, difficulty: "easy", question: "What is the capital of Sweden?", answers: ["Stockholm", "Gothenburg", "Malmö", "Uppsala"], correct: 0 },
      { id: "p1q2", playerName: "Anna Lindgren", round: 2, difficulty: "medium", question: "How many sides does a hexagon have?", answers: ["5", "6", "7", "8"], correct: 1 },
      { id: "p1q3", playerName: "Anna Lindgren", round: 3, difficulty: "hard", question: "What year did the Berlin Wall fall?", answers: ["1987", "1988", "1989", "1990"], correct: 2 },
    ],
  },
  {
    id: "p2",
    name: "Erik Johansson",
    questions: [
      { id: "p2q1", playerName: "Erik Johansson", round: 1, difficulty: "easy", question: "What color is the sky on a clear day?", answers: ["Green", "Blue", "Red", "Yellow"], correct: 1 },
      { id: "p2q2", playerName: "Erik Johansson", round: 2, difficulty: "medium", question: "What is 12 multiplied by 12?", answers: ["124", "134", "144", "154"], correct: 2 },
      { id: "p2q3", playerName: "Erik Johansson", round: 3, difficulty: "hard", question: "Who painted the Mona Lisa?", answers: ["Michelangelo", "Raphael", "Botticelli", "Leonardo da Vinci"], correct: 3 },
    ],
  },
  {
    id: "p3",
    name: "Sara Bergström",
    questions: [
      { id: "p3q1", playerName: "Sara Bergström", round: 1, difficulty: "easy", question: "How many days are in a week?", answers: ["5", "6", "7", "8"], correct: 2 },
      { id: "p3q2", playerName: "Sara Bergström", round: 2, difficulty: "medium", question: "What planet is closest to the sun?", answers: ["Venus", "Earth", "Mercury", "Mars"], correct: 2 },
      { id: "p3q3", playerName: "Sara Bergström", round: 3, difficulty: "hard", question: "In what year did World War II end?", answers: ["1943", "1944", "1945", "1946"], correct: 2 },
    ],
  },
  {
    id: "p4",
    name: "Marcus Eriksson",
    questions: [
      { id: "p4q1", playerName: "Marcus Eriksson", round: 1, difficulty: "easy", question: "What is 2 + 2?", answers: ["3", "4", "5", "6"], correct: 1 },
      { id: "p4q2", playerName: "Marcus Eriksson", round: 2, difficulty: "medium", question: "How many continents are there on Earth?", answers: ["5", "6", "7", "8"], correct: 2 },
      { id: "p4q3", playerName: "Marcus Eriksson", round: 3, difficulty: "hard", question: "What is the chemical symbol for gold?", answers: ["Go", "Gd", "Gl", "Ag"], correct: 0, trapAnswer: "Au" },
    ],
  },
];

export const ALL_PLAYERS: string[] = PLAYERS.map((p) => p.name);

export const WHEEL_SEGMENT_COUNT = 16;
