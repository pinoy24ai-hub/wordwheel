/* ──────────────────────────────────────────────────────────
   words.js  –  WordWheel puzzle pool.
   Each difficulty has 50+ puzzles; 20 are randomly sampled
   per session so every playthrough feels different.

   Categories: Animals, Food, Places, Actions, Nature, Pinoy
   Letters must be an exact anagram of the target.
   ────────────────────────────────────────────────────────── */

const WORD_SETS = {

  /* ════════════════════════════════════════════
     EASY  –  5-letter words, no timer  (56 puzzles)
     ════════════════════════════════════════════ */
  easy: [

    /* ── Original 20 ── */
    { letters: ['D','R','A','E','B'], target: 'BREAD',  category: 'Food'      },
    { letters: ['M','B','L','I','C'], target: 'CLIMB',  category: 'Actions'   },
    { letters: ['C','A','D','N','E'], target: 'DANCE',  category: 'Actions'   },
    { letters: ['R','H','E','A','T'], target: 'EARTH',  category: 'Nature'    },
    { letters: ['M','A','F','E','L'], target: 'FLAME',  category: 'Nature'    },
    { letters: ['P','A','R','G','E'], target: 'GRAPE',  category: 'Food'      },
    { letters: ['T','R','H','A','E'], target: 'HEART',  category: 'Nature'    },
    { letters: ['C','I','J','E','U'], target: 'JUICE',  category: 'Food'      },
    { letters: ['F','N','K','E','I'], target: 'KNIFE',  category: 'Objects'   },
    { letters: ['H','L','T','G','I'], target: 'LIGHT',  category: 'Nature'    },
    { letters: ['I','M','C','S','U'], target: 'MUSIC',  category: 'Art'       },
    { letters: ['G','T','H','N','I'], target: 'NIGHT',  category: 'Nature'    },
    { letters: ['N','A','O','C','E'], target: 'OCEAN',  category: 'Nature'    },
    { letters: ['N','P','A','T','I'], target: 'PAINT',  category: 'Art'       },
    { letters: ['I','N','R','B','O'], target: 'ROBIN',  category: 'Animals'   },
    { letters: ['L','E','H','S','F'], target: 'SHELF',  category: 'Objects'   },
    { letters: ['G','E','I','T','R'], target: 'TIGER',  category: 'Animals'   },
    { letters: ['D','R','N','U','E'], target: 'UNDER',  category: 'Actions'   },
    { letters: ['A','C','V','L','O'], target: 'VOCAL',  category: 'Music'     },
    { letters: ['O','L','W','D','R'], target: 'WORLD',  category: 'Nature'    },

    /* ── Animals ── */
    { letters: ['G','E','A','L','E'], target: 'EAGLE',  category: 'Animals'   },
    { letters: ['S','H','R','O','E'], target: 'HORSE',  category: 'Animals'   },
    { letters: ['K','H','S','A','R'], target: 'SHARK',  category: 'Animals'   },
    { letters: ['N','C','E','R','A'], target: 'CRANE',  category: 'Animals'   },
    { letters: ['I','S','B','O','N'], target: 'BISON',  category: 'Animals'   },
    { letters: ['T','R','U','O','T'], target: 'TROUT',  category: 'Animals'   },
    { letters: ['N','A','I','S','L'], target: 'SNAIL',  category: 'Animals'   },
    { letters: ['L','M','E','U','R'], target: 'LEMUR',  category: 'Animals'   },

    /* ── Food ── */
    { letters: ['M','C','R','E','A'], target: 'CREAM',  category: 'Food'      },
    { letters: ['H','P','E','A','C'], target: 'PEACH',  category: 'Food'      },
    { letters: ['O','M','G','N','A'], target: 'MANGO',  category: 'Food'      },
    { letters: ['G','U','S','A','R'], target: 'SUGAR',  category: 'Food'      },
    { letters: ['E','L','M','O','N'], target: 'LEMON',  category: 'Food'      },
    { letters: ['N','O','B','A','C'], target: 'BACON',  category: 'Food'      },
    { letters: ['T','D','U','N','O'], target: 'DONUT',  category: 'Food'      },
    { letters: ['A','P','T','S','A'], target: 'PASTA',  category: 'Food'      },

    /* ── Places ── */
    { letters: ['O','R','I','C','A'], target: 'CAIRO',  category: 'Places'    },
    { letters: ['I','B','A','D','U'], target: 'DUBAI',  category: 'Places'    },
    { letters: ['I','L','H','D','E'], target: 'DELHI',  category: 'Places'    },
    { letters: ['A','Y','K','N','E'], target: 'KENYA',  category: 'Places'    },
    { letters: ['Y','L','T','A','I'], target: 'ITALY',  category: 'Places'    },
    { letters: ['A','N','I','H','C'], target: 'CHINA',  category: 'Places'    },

    /* ── Actions ── */
    { letters: ['N','K','I','T','H'], target: 'THINK',  category: 'Actions'   },
    { letters: ['E','R','W','T','I'], target: 'WRITE',  category: 'Actions'   },
    { letters: ['H','S','A','C','E'], target: 'CHASE',  category: 'Actions'   },
    { letters: ['L','S','I','D','E'], target: 'SLIDE',  category: 'Actions'   },
    { letters: ['H','U','S','T','O'], target: 'SHOUT',  category: 'Actions'   },

    /* ── Nature ── */
    { letters: ['R','V','I','E','R'], target: 'RIVER',  category: 'Nature'    },
    { letters: ['E','L','D','F','I'], target: 'FIELD',  category: 'Nature'    },
    { letters: ['E','T','A','P','L'], target: 'PETAL',  category: 'Nature'    },

    /* ── Pinoy ── */
    { letters: ['U','T','R','O','N'], target: 'TURON',  category: 'Pinoy'     },
    { letters: ['A','S','M','U','N'], target: 'SUMAN',  category: 'Pinoy'     },
    { letters: ['N','I','G','A','S'], target: 'SINAG',  category: 'Pinoy'     },
    { letters: ['U','T','A','G','B'], target: 'GUBAT',  category: 'Pinoy'     },
    { letters: ['B','I','D','U','K'], target: 'BUKID',  category: 'Pinoy'     },
    { letters: ['G','Y','O','B','A'], target: 'BAGYO',  category: 'Pinoy'     },
  ],

  /* ════════════════════════════════════════════
     MEDIUM  –  6-letter words, 60-second timer  (54 puzzles)
     ════════════════════════════════════════════ */
  medium: [

    /* ── Original 20 ── */
    { letters: ['D','G','N','A','E','R'], target: 'GARDEN', category: 'Nature'      },
    { letters: ['R','G','E','B','I','D'], target: 'BRIDGE', category: 'Structures'  },
    { letters: ['W','R','F','O','E','L'], target: 'FLOWER', category: 'Nature'      },
    { letters: ['N','L','T','A','P','E'], target: 'PLANET', category: 'Nature'      },
    { letters: ['E','M','A','R','T','S'], target: 'STREAM', category: 'Nature'      },
    { letters: ['T','A','C','L','E','S'], target: 'CASTLE', category: 'Structures'  },
    { letters: ['T','N','W','E','I','R'], target: 'WINTER', category: 'Nature'      },
    { letters: ['N','P','S','G','I','R'], target: 'SPRING', category: 'Nature'      },
    { letters: ['G','E','J','N','U','L'], target: 'JUNGLE', category: 'Nature'      },
    { letters: ['A','I','S','D','L','N'], target: 'ISLAND', category: 'Places'      },
    { letters: ['R','A','M','L','B','E'], target: 'MARBLE', category: 'Materials'   },
    { letters: ['S','O','F','E','R','T'], target: 'FOREST', category: 'Nature'      },
    { letters: ['G','N','I','T','H','S'], target: 'NIGHTS', category: 'Nature'      },
    { letters: ['O','L','C','S','U','D'], target: 'CLOUDS', category: 'Nature'      },
    { letters: ['Z','F','O','E','N','R'], target: 'FROZEN', category: 'Nature'      },
    { letters: ['G','T','B','H','I','R'], target: 'BRIGHT', category: 'Nature'      },
    { letters: ['G','D','O','R','N','U'], target: 'GROUND', category: 'Nature'      },
    { letters: ['V','S','I','R','L','E'], target: 'SILVER', category: 'Materials'   },
    { letters: ['O','G','L','D','E','N'], target: 'GOLDEN', category: 'Nature'      },
    { letters: ['T','I','P','E','A','R'], target: 'PIRATE', category: 'Actions'     },

    /* ── Animals ── */
    { letters: ['U','C','T','A','O','N'], target: 'TOUCAN', category: 'Animals'     },
    { letters: ['N','L','F','O','A','C'], target: 'FALCON', category: 'Animals'     },
    { letters: ['U','W','L','R','A','S'], target: 'WALRUS', category: 'Animals'     },
    { letters: ['N','H','T','Y','O','P'], target: 'PYTHON', category: 'Animals'     },
    { letters: ['D','P','S','I','E','R'], target: 'SPIDER', category: 'Animals'     },
    { letters: ['P','I','A','G','M','E'], target: 'MAGPIE', category: 'Animals'     },
    { letters: ['H','M','R','S','I','P'], target: 'SHRIMP', category: 'Animals'     },
    { letters: ['Y','D','O','N','E','K'], target: 'DONKEY', category: 'Animals'     },

    /* ── Food ── */
    { letters: ['L','I','G','R','A','C'], target: 'GARLIC', category: 'Food'        },
    { letters: ['M','D','O','A','L','N'], target: 'ALMOND', category: 'Food'        },
    { letters: ['T','L','N','A','W','U'], target: 'WALNUT', category: 'Food'        },
    { letters: ['G','T','U','O','R','Y'], target: 'YOGURT', category: 'Food'        },
    { letters: ['P','T','N','R','U','I'], target: 'TURNIP', category: 'Food'        },
    { letters: ['H','D','I','A','R','S'], target: 'RADISH', category: 'Food'        },
    { letters: ['M','U','N','G','T','E'], target: 'NUTMEG', category: 'Food'        },
    { letters: ['V','E','L','O','C','S'], target: 'CLOVES', category: 'Food'        },

    /* ── Places ── */
    { letters: ['N','E','A','R','F','C'], target: 'FRANCE', category: 'Places'      },
    { letters: ['Z','R','B','I','A','L'], target: 'BRAZIL', category: 'Places'      },
    { letters: ['X','I','O','M','E','C'], target: 'MEXICO', category: 'Places'      },
    { letters: ['K','R','T','U','E','Y'], target: 'TURKEY', category: 'Places'      },
    { letters: ['A','N','W','O','R','Y'], target: 'NORWAY', category: 'Places'      },
    { letters: ['D','P','L','O','N','A'], target: 'POLAND', category: 'Places'      },

    /* ── Actions ── */
    { letters: ['C','A','G','N','E','L'], target: 'GLANCE', category: 'Actions'     },
    { letters: ['T','R','P','S','N','I'], target: 'SPRINT', category: 'Actions'     },
    { letters: ['D','R','E','N','A','W'], target: 'WANDER', category: 'Actions'     },

    /* ── Nature ── */
    { letters: ['D','P','I','A','R','S'], target: 'RAPIDS', category: 'Nature'      },
    { letters: ['R','A','G','I','M','E'], target: 'MIRAGE', category: 'Nature'      },

    /* ── Pinoy ── */
    { letters: ['N','C','H','E','L','O'], target: 'LECHON', category: 'Pinoy'       },
    { letters: ['P','M','L','I','A','U'], target: 'LUMPIA', category: 'Pinoy'       },
    { letters: ['G','U','N','B','S','A'], target: 'BANGUS', category: 'Pinoy'       },
    { letters: ['O','M','C','T','E','A'], target: 'CAMOTE', category: 'Pinoy'       },
    { letters: ['L','B','O','A','K','I'], target: 'KALIBO', category: 'Pinoy'       },
    { letters: ['T','V','A','C','E','I'], target: 'CAVITE', category: 'Pinoy'       },
    { letters: ['G','B','A','I','U','O'], target: 'BAGUIO', category: 'Pinoy'       },
  ],

  /* ════════════════════════════════════════════
     HARD  –  7-letter words, 30-second timer,
              hints cost 10 pts  (54 puzzles)
     ════════════════════════════════════════════ */
  hard: [

    /* ── Original 20 ── */
    { letters: ['K','E','B','T','N','A','L'], target: 'BLANKET',  category: 'Objects'   },
    { letters: ['N','C','T','A','E','B','I'], target: 'CABINET',  category: 'Objects'   },
    { letters: ['P','I','D','N','O','L','H'], target: 'DOLPHIN',  category: 'Animals'   },
    { letters: ['T','H','G','S','I','L','F'], target: 'FLIGHTS',  category: 'Actions'   },
    { letters: ['P','I','G','E','S','M','L'], target: 'GLIMPSE',  category: 'Actions'   },
    { letters: ['E','N','H','S','T','U','R'], target: 'HUNTERS',  category: 'Actions'   },
    { letters: ['R','D','I','N','S','A','W'], target: 'INWARDS',  category: 'Actions'   },
    { letters: ['G','D','K','M','I','O','N'], target: 'KINGDOM',  category: 'Places'    },
    { letters: ['G','T','L','E','S','R','A'], target: 'LARGEST',  category: 'Objects'   },
    { letters: ['C','H','M','E','S','T','A'], target: 'MATCHES',  category: 'Objects'   },
    { letters: ['B','M','N','R','U','E','S'], target: 'NUMBERS',  category: 'Objects'   },
    { letters: ['I','T','O','N','U','E','L'], target: 'OUTLINE',  category: 'Art'       },
    { letters: ['N','T','P','R','A','I','E'], target: 'PAINTER',  category: 'Art'       },
    { letters: ['C','K','Q','L','I','Y','U'], target: 'QUICKLY',  category: 'Actions'   },
    { letters: ['T','N','R','G','U','O','I'], target: 'ROUTING',  category: 'Tech'      },
    { letters: ['D','B','S','O','N','X','A'], target: 'SANDBOX',  category: 'Tech'      },
    { letters: ['D','N','T','R','H','E','U'], target: 'THUNDER',  category: 'Nature'    },
    { letters: ['A','W','U','D','P','S','R'], target: 'UPWARDS',  category: 'Actions'   },
    { letters: ['A','G','V','R','Y','E','O'], target: 'VOYAGER',  category: 'Actions'   },
    { letters: ['D','N','W','S','O','R','E'], target: 'WONDERS',  category: 'Nature'    },

    /* ── Animals ── */
    { letters: ['H','T','R','N','A','E','P'], target: 'PANTHER',  category: 'Animals'   },
    { letters: ['G','N','U','I','P','E','N'], target: 'PENGUIN',  category: 'Animals'   },
    { letters: ['T','O','B','L','E','S','R'], target: 'LOBSTER',  category: 'Animals'   },
    { letters: ['A','L','P','N','I','C','E'], target: 'PELICAN',  category: 'Animals'   },
    { letters: ['M','T','A','S','E','R','H'], target: 'HAMSTER',  category: 'Animals'   },
    { letters: ['O','I','U','C','R','A','B'], target: 'CARIBOU',  category: 'Animals'   },
    { letters: ['R','T','O','I','H','S','C'], target: 'OSTRICH',  category: 'Animals'   },

    /* ── Food ── */
    { letters: ['T','P','I','R','O','C','A'], target: 'APRICOT',  category: 'Food'      },
    { letters: ['S','D','T','C','U','R','A'], target: 'CUSTARD',  category: 'Food'      },
    { letters: ['N','I','S','P','H','C','A'], target: 'SPINACH',  category: 'Food'      },
    { letters: ['L','O','R','T','P','U','Y'], target: 'POULTRY',  category: 'Food'      },
    { letters: ['Z','O','R','H','I','C','O'], target: 'CHORIZO',  category: 'Food'      },
    { letters: ['T','P','A','O','I','C','A'], target: 'TAPIOCA',  category: 'Food'      },

    /* ── Places ── */
    { letters: ['T','N','M','A','I','V','E'], target: 'VIETNAM',  category: 'Places'    },
    { letters: ['N','I','D','R','L','A','E'], target: 'IRELAND',  category: 'Places'    },
    { letters: ['D','A','U','R','C','O','E'], target: 'ECUADOR',  category: 'Places'    },
    { letters: ['D','A','L','N','I','C','E'], target: 'ICELAND',  category: 'Places'    },
    { letters: ['N','I','A','R','K','U','E'], target: 'UKRAINE',  category: 'Places'    },

    /* ── Actions ── */
    { letters: ['N','U','R','O','J','Y','E'], target: 'JOURNEY',  category: 'Actions'   },
    { letters: ['L','P','R','K','A','S','E'], target: 'SPARKLE',  category: 'Actions'   },
    { letters: ['M','E','B','T','L','R','E'], target: 'TREMBLE',  category: 'Actions'   },
    { letters: ['T','H','B','E','R','A','E'], target: 'BREATHE',  category: 'Actions'   },
    { letters: ['L','T','H','E','S','R','E'], target: 'SHELTER',  category: 'Actions'   },

    /* ── Nature ── */
    { letters: ['N','T','M','U','A','S','I'], target: 'TSUNAMI',  category: 'Nature'    },
    { letters: ['I','L','E','C','G','R','A'], target: 'GLACIER',  category: 'Nature'    },
    { letters: ['R','O','T','N','R','E','T'], target: 'TORRENT',  category: 'Nature'    },

    /* ── Pinoy ── */
    { letters: ['Z','A','G','P','L','I','E'], target: 'LEGAZPI',  category: 'Pinoy'     },
    { letters: ['G','R','O','A','U','I','S'], target: 'SURIGAO',  category: 'Pinoy'     },
    { letters: ['G','D','U','N','L','I','A'], target: 'LAGUNDI',  category: 'Pinoy'     },
    { letters: ['M','A','B','L','U','K','O'], target: 'KULAMBO',  category: 'Pinoy'     },
    { letters: ['U','L','M','I','K','T','A'], target: 'MAKULIT',  category: 'Pinoy'     },
    { letters: ['S','B','A','L','H','O','A'], target: 'HALABOS',  category: 'Pinoy'     },
    { letters: ['K','T','A','L','S','O','A'], target: 'SALAKOT',  category: 'Pinoy'     },
    { letters: ['G','A','T','O','L','A','G'], target: 'TAGALOG',  category: 'Pinoy'     },
  ],
};
