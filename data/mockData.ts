export const ALL_PLAYERS: string[] = [
  "Erik Lindqvist",
  "Sara Johansson",
  "Anders Eriksson",
  "Maria Karlsson",
  "Johan Nilsson",
  "Maja Andersson",
  "Lars Pettersson",
  "Emma Svensson",
  "Oskar Gustafsson",
  "Lina Persson",
  "Mikael Larsson",
  "Klara Olsson",
  "Gustav Magnusson",
  "Hanna Hansson",
  "Filip Lundberg",
];

export interface Question {
  text: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export const QUESTIONS: Question[] = [
  {
    text: 'What does "HTML" stand for?',
    answers: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyper Transfer Markup Logic",
      "Home Tool Markup Language",
    ],
    correct: 0,
  },
  {
    text: "What year was the first iPhone released?",
    answers: ["2005", "2006", "2007", "2008"],
    correct: 2,
  },
  {
    text: "Which programming language was created by Brendan Eich in 1995?",
    answers: ["Python", "Java", "Ruby", "JavaScript"],
    correct: 3,
  },
  {
    text: 'What does "API" stand for?',
    answers: [
      "Application Programming Interface",
      "Automated Protocol Integration",
      "Application Process Interaction",
      "Advanced Programming Index",
    ],
    correct: 0,
  },
  // {
  //   text: "Which company originally created the React JavaScript library?",
  //   answers: ["Google", "Microsoft", "Twitter", "Facebook"],
  //   correct: 3,
  // },
  // {
  //   text: "What is the default port for HTTPS traffic?",
  //   answers: ["80", "8080", "443", "3000"],
  //   correct: 2,
  // },
  // {
  //   text: "In Git, what command creates a new branch and immediately switches to it?",
  //   answers: [
  //     "git new -b branch",
  //     "git checkout -b branch",
  //     "git branch --switch",
  //     "git create branch",
  //   ],
  //   correct: 1,
  // },
  // {
  //   text: 'What does "SQL" stand for?',
  //   answers: [
  //     "System Query Logic",
  //     "Simple Query Language",
  //     "Structured Query Language",
  //     "Standard Query Link",
  //   ],
  //   correct: 2,
  // },
  // {
  //   text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
  //   answers: ['Queue', 'Tree', 'Linked List', 'Stack'],
  //   correct: 3,
  // },
  // {
  //   text: 'What is the average time complexity of binary search?',
  //   answers: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'],
  //   correct: 3,
  // },
  // {
  //   text: 'Which HTTP method is used to partially update a resource?',
  //   answers: ['PUT', 'POST', 'PATCH', 'UPDATE'],
  //   correct: 2,
  // },
  // {
  //   text: 'What does "CI/CD" stand for?',
  //   answers: [
  //     'Code Integration / Code Delivery',
  //     'Continuous Integration / Continuous Delivery',
  //     'Central Integration / Central Deployment',
  //     'Compiled Integration / Compiled Delivery',
  //   ],
  //   correct: 1,
  // },
  // {
  //   text: 'Which OSI layer does the TCP protocol operate on?',
  //   answers: ['Network (Layer 3)', 'Data Link (Layer 2)', 'Transport (Layer 4)', 'Application (Layer 7)'],
  //   correct: 2,
  // },
  // {
  //   text: 'What is the primary purpose of Docker?',
  //   answers: [
  //     'Database management',
  //     'Version control',
  //     'Load balancing',
  //     'Application containerization',
  //   ],
  //   correct: 3,
  // },
  // {
  //   text: 'In Big O notation, what is the average-case time complexity of accessing an element in a hash map?',
  //   answers: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
  //   correct: 3,
  // },
];

export const PRIZE_LADDER: number[] = [
  100, 200, 300, 500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 64_000,
  125_000, 250_000, 500_000, 1_000_000,
];

// Safe levels — contestant keeps this amount if eliminated above them
export const SAFE_LEVELS = new Set([4, 9]);
