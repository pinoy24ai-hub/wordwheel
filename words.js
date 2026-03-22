/* ──────────────────────────────────────────────────────────
   words.js  –  20 WordWheel puzzles
   Each puzzle:
     letters  – 6 letters pre-shuffled for the wheel
     target   – the word the player must spell (uses all 6 letters)
     category – shown as a hint chip above the wheel
   ────────────────────────────────────────────────────────── */

const PUZZLES = [
  { letters: ['D','G','N','A','E','R'], target: 'GARDEN', category: 'Plants'      },
  { letters: ['R','G','E','B','I','D'], target: 'BRIDGE', category: 'Structures'  },
  { letters: ['W','R','F','O','E','L'], target: 'FLOWER', category: 'Plants'      },
  { letters: ['N','L','T','A','P','E'], target: 'PLANET', category: 'Space'       },
  { letters: ['E','M','A','R','T','S'], target: 'STREAM', category: 'Nature'      },
  { letters: ['T','A','C','L','E','S'], target: 'CASTLE', category: 'Structures'  },
  { letters: ['T','N','W','E','I','R'], target: 'WINTER', category: 'Seasons'     },
  { letters: ['N','P','S','G','I','R'], target: 'SPRING', category: 'Seasons'     },
  { letters: ['G','E','J','N','U','L'], target: 'JUNGLE', category: 'Nature'      },
  { letters: ['A','I','S','D','L','N'], target: 'ISLAND', category: 'Geography'   },
  { letters: ['R','A','M','L','B','E'], target: 'MARBLE', category: 'Materials'   },
  { letters: ['S','O','F','E','R','T'], target: 'FOREST', category: 'Nature'      },
  { letters: ['G','N','I','T','H','S'], target: 'NIGHTS', category: 'Time'        },
  { letters: ['O','L','C','S','U','D'], target: 'CLOUDS', category: 'Weather'     },
  { letters: ['Z','F','O','E','N','R'], target: 'FROZEN', category: 'Weather'     },
  { letters: ['G','T','B','H','I','R'], target: 'BRIGHT', category: 'Light'       },
  { letters: ['G','D','O','R','N','U'], target: 'GROUND', category: 'Nature'      },
  { letters: ['V','S','I','R','L','E'], target: 'SILVER', category: 'Materials'   },
  { letters: ['O','G','L','D','E','N'], target: 'GOLDEN', category: 'Colors'      },
  { letters: ['T','I','P','E','A','R'], target: 'PIRATE', category: 'Adventure'   },
];
