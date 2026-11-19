// All game text and shared constants. Edit the content here without touching the game code.

const PAL = {
  ink: '#0d0b1e', night: '#1b1f3b', navy: '#263066', plum: '#6b2f72', wine: '#a3263f',
  red: '#e2434b', orange: '#f58a2e', gold: '#ffd23f', cream: '#fff4d6',
  grass: '#4aa84f', grassD: '#368a43', grassL: '#6cc463',
  leaf: '#22603a', leafM: '#2f8a45', leafL: '#5cc25a', leafD: '#1a4a2c',
  sky: '#4fb3ea', blue: '#2f6fd0', steel: '#9aa3b8', stone: '#cfc6b0', stoneD: '#a99f88',
  slate: '#545a72', path: '#e0c28a', pathD: '#b48f58', wood: '#8a5636', woodD: '#5a3622',
  skinA: '#8d5a3a', skinB: '#b07a52', skinC: '#d6a27a', hairA: '#1a1210', hairB: '#4a2a1a',
  mint: '#7ee08a', pink: '#ff8fb8'
};

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61566846519500';

const ZONE_ORDER = ['stem', 'vision', 'goal', 'model', 'elec', 'code'];
const ZONE_LABEL = { stem: 'STEM', vision: 'VISION', goal: 'GOAL', model: '3D', elec: 'ELEC', code: 'CODE' };

const CHAR_COLORS = {
  player: { h: PAL.hairA, s: PAL.skinB, t: PAL.gold, d: '#d19f22', p: PAL.navy, k: PAL.ink },
  stem:   { h: PAL.hairB, s: PAL.skinC, t: PAL.orange, d: '#c96a1f', p: PAL.slate, k: PAL.ink },
  vision: { h: PAL.hairA, s: PAL.skinA, t: PAL.sky, d: '#2f86bf', p: PAL.night, k: PAL.ink },
  goal:   { h: '#3a1a2a', s: PAL.skinB, t: PAL.mint, d: '#4fb35d', p: PAL.wood, k: PAL.ink },
  model:  { h: PAL.hairB, s: PAL.skinA, t: PAL.blue, d: '#2253a0', p: PAL.night, k: PAL.ink },
  elec:   { h: PAL.hairA, s: PAL.skinC, t: PAL.red, d: '#b02a33', p: PAL.slate, k: PAL.ink },
  code:   { h: PAL.hairA, s: PAL.skinB, t: PAL.plum, d: '#4d1f54', p: PAL.navy, k: PAL.ink },
  w1:     { h: PAL.hairB, s: PAL.skinB, t: PAL.pink, d: '#d0688e', p: PAL.navy, k: PAL.ink },
  w2:     { h: PAL.hairA, s: PAL.skinA, t: PAL.cream, d: '#cfc2a0', p: PAL.wood, k: PAL.ink },
  w3:     { h: '#6a4a2a', s: PAL.skinC, t: '#3fb6a8', d: '#2c8a80', p: PAL.slate, k: PAL.ink }
};

const INTRO = {
  name: 'MISSION BRIEFING',
  lines: [
    'Welcome, explorer! You just arrived at the STEM Club campus.',
    'Your mission: find out what STEM Club is all about.',
    'Talk to the people marked with ! in the 6 zones to collect MISSION DATA.',
    'When you have all 6, the MISSION ROOM in the center of the campus will open.'
  ],
  keys: ['Move with the ARROW keys or WASD. Press SPACE to talk. Good luck!'],
  touch: ['Move with the PAD. Press A to talk. Good luck!']
};

const DIALOGS = {
  stem: {
    name: 'REBECCA - CLUB GUIDE',
    lines: [
      'Hi! Welcome to STEM Hall, where it all starts.',
      'STEM stands for four fields that shape our world:',
      'S is for SCIENCE: understanding how the world works.',
      'T is for TECHNOLOGY: the tools and apps we use to solve problems.',
      'E is for ENGINEERING: designing and building things that work.',
      'M is for MATHEMATICS: the language behind all of them.',
      "Science, creativity and the doer mindset: that's STEM Club!"
    ]
  },
  vision: {
    name: 'HANAFY - VISION KEEPER',
    lines: [
      "From the top of this tower, you can see far ahead. That's our VISION.",
      "First: help young people realise how important STEM fields are in today's world.",
      'Phones, medicine, energy, farming, transport... STEM is behind all of them.',
      'Second: help you take your first steps into STEM, even if you start from zero.',
      'Third: help you grow your skills, step by step, project after project.'
    ]
  },
  goal: {
    name: 'FABIEN - CLUB MEMBER',
    lines: [
      'In this garden, things grow. Just like our members!',
      'Our GOAL: skilled members, both technically and at a personal level.',
      'Technically: we learn to model in 3D, build circuits and write code.',
      'Personally: problem solving, autonomy and drive, execution, coordination and communication.',
      'In short, we grow DRIVEN PROBLEM SOLVERS.'
    ]
  },
  model: {
    name: 'MANDRESY - 3D MODELLING LAB',
    lines: [
      'Welcome to the 3D Modelling Lab!',
      'Before we build anything, we design it in 3D on a computer.',
      'Engineers describe a 3D object with flat views: TOP, FRONT and SIDE.'
    ],
    ask: 'Want to try a quick 3D challenge?',
    puzzle: 'model',
    win: 'Great job! You just read a technical drawing like an engineer.',
    skip: "No problem. It takes practice, and that's what the club is for!",
    outro: ['At STEM Club we design real objects in 3D modelling software, from simple shapes to parts for our own projects.']
  },
  elec: {
    name: 'MARTIAL - ELECTRONICS LAB',
    lines: [
      'Welcome to the Electronics Lab!',
      'We build circuits with Arduino and ESP32 boards, motors, sensors and screens.',
      'Every circuit follows one rule: current needs a CLOSED LOOP.'
    ],
    ask: 'Want to try to light an LED?',
    puzzle: 'elec',
    win: "It works! That's the first circuit every maker builds.",
    skip: "No worries, we'll wire it together at the club!",
    outro: ['At STEM Club we wire real LEDs, motors and sensors, then bring them to life with code.']
  },
  code: {
    name: 'ARDI - PROGRAMMING LAB',
    lines: [
      'Welcome to the Programming Lab!',
      'We learn to code, starting with the C language.',
      'A program is a list of exact instructions. The computer does what you write, not what you meant!'
    ],
    ask: 'Want to program a robot?',
    puzzle: 'code',
    win: 'Nice code! You used a loop, just like real programmers.',
    skip: "That's fine. Every programmer started with a first line!",
    outro: ['At STEM Club we write real programs, from our first hello world in C to apps like iPass, built by members for the American Corner.']
  }
};

const MISSION_LOCKED = n => [
  'The MISSION ROOM is locked.',
  `Mission data: ${n}/6. Talk to the people in every zone to collect the rest.`
];

const ENDING_LINES = [
  { t: '> ACCESSING MISSION DATA...', cls: 'dim' },
  { t: '> 6/6 FILES DECRYPTED. ACCESS GRANTED.', cls: 'dim' },
  { t: '' },
  { t: 'STEM = SCIENCE / TECHNOLOGY / ENGINEERING / MATHEMATICS', cls: 'hi' },
  { t: "VISION: Help young people realise how important STEM fields are in today's world, take their first steps into them, and grow their skills." },
  { t: 'GOAL: Skilled members, technically and personally => DRIVEN PROBLEM SOLVERS.' },
  { t: 'WE DO: 3D MODELLING / ELECTRONICS / PROGRAMMING' },
  { t: '' },
  { t: 'YOUR MISSION, IF YOU ACCEPT IT:', cls: 'hi' },
  { t: 'JOIN STEM CLUB.', cls: 'big' }
];

const PUZZLE_TEXT = {
  model: {
    title: '3D LAB - MATCH THE VIEWS',
    goal: 'Build a model whose TOP, FRONT and SIDE views match the target. Tap a tile to stack blocks on it (0 to 3).',
    hint: 'TOP shows WHERE the blocks are. FRONT shows the tallest stack in each column. SIDE shows the tallest stack in each row. Start with TOP, then set the heights.'
  },
  elec: {
    title: 'ELECTRONICS LAB - LIGHT THE LED',
    goal: 'Tap the tiles to rotate them and make a closed loop from the battery + to -. Put a part in the empty slot, then press POWER.',
    hint: 'Follow the wire from the battery + (top) all the way around to - (bottom). Every tile must connect to the next one.'
  },
  code: {
    title: 'PROGRAMMING LAB - GUIDE THE BOT',
    goal: 'Write a program that drives the bot to the flag. Max 6 lines! Press + on a line of your code to repeat it.',
    hint: 'Count the squares in each straight corridor. Then press + on a forward(); line: repeat(5) forward(); moves the bot 5 squares with one line.'
  }
};
