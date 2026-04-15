import express, { Request } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

declare global {
  namespace Express {
    interface Request {
      teamId: string;
      team?: any;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0) return 1;
  let res = 1;
  for (let i = 1; i <= n; i++) res *= i;
  return res;
};

const round1Questions = [
  { id: "q1", logic: (x: number) => (x * (x + 1)) / 2, answer: "n(n+1)/2" },
  { id: "q2", logic: (x: number) => factorial(x + 1), answer: "(x+1)!" },
  { id: "q3", logic: (x: number) => Math.pow(x, 4), answer: "x^4" },
  { id: "q4", logic: (x: number) => factorial(x - 1), answer: "(x-1)!" },
  { id: "q5", logic: (x: number) => 10 * x + 1, answer: "10x+1" },
  { id: "q6", logic: (x: number) => 1 / Math.tan(x * Math.PI / 180), answer: "cot(x)" },
  { id: "q7", logic: (x: number) => 2 * x - 1, answer: "2x-1" },
  { id: "q8", logic: (x: number) => 2 * x + 1, answer: "2x+1" },
  { id: "q9", logic: (x: number) => Math.pow(x, 3) - 1, answer: "x^3-1" },
  { id: "q10", logic: (x: number) => x * (x - 1), answer: "x(x-1)" },
  { id: "q11", logic: (x: number) => Math.pow(x + 1, 2), answer: "(x+1)^2" },
  { id: "q12", logic: (x: number) => ((x - 1) * (x - 2)) / 2, answer: "(x-1)(x-2)/2" },
  { id: "q13", logic: (x: number) => Math.pow(x - 1, 2), answer: "(x-1)^2" },
  { id: "q14", logic: (x: number) => x * (x + 2), answer: "x(x+2)" },
  { id: "q15", logic: (x: number) => Math.pow(Math.sin(x * Math.PI / 180), 2) + Math.pow(Math.cos(x * Math.PI / 180), 2), answer: "sin^2(x)+cos^2(x)" },
  { id: "q16", logic: (x: number) => Math.pow(1/Math.cos(x * Math.PI / 180), 2) - Math.pow(Math.tan(x * Math.PI / 180), 2), answer: "sec^2(x)-tan^2(x)" },
  { id: "q17", logic: (x: number) => Math.pow(x, 3) + 1, answer: "x^3+1" },
  { id: "q18", logic: (x: number) => (x * (x + 1)) / 2 + 1, answer: "(x(x+1)/2)+1" },
  { id: "q19", logic: (x: number) => (x * (x + 1) * (2 * x + 1)) / 6, answer: "n(n+1)(2n+1)/6" },
  { id: "q20", logic: (x: number) => (x * (x - 1)) / 2, answer: "(x(x-1))/2" }
];

const round2Challenges = [
  { id: "c1", url: "/challenges/ch1.html", flag: "flag{b4s64_d3c0d3d}" },
  { id: "c2", url: "/challenges/ch2.html", flag: "flag{r0t13_h1dd3n}" },
  { id: "c3", url: "/challenges/ch3.html", flag: "flag{x0r_m4st3r}" },
  { id: "c4", url: "/challenges/ch4.html", flag: "flag{c43s4r_sh1ft}" },
  { id: "c5", url: "/challenges/ch5.html", flag: "flag{c00k13_s3cr3t}" },
  { id: "c6", url: "/challenges/ch6.html", flag: "flag{l0c4l_strg_fl4g}" },
  { id: "c7", url: "/challenges/ch7.html", flag: "flag{f4k3_4p1_c4ll}" },
  { id: "c8", url: "/challenges/ch8.html", flag: "flag{css_1s_4w3s0m3}" },
  { id: "c9", url: "/challenges/ch9.html", flag: "flag{u1r_m4n1p_fl4g}" },
  { id: "c10", url: "/challenges/ch10.html", flag: "flag{m1x3d_3nc0d1ng}" }
];

const round3Products = [
  "Power Bank", "Wired Headphones", "Plastic Water Bottle", "Laptop Cooling Pad",
  "Extension Board", "Plastic Chair", "Low Quality Keyboard", "Ink Cartridge Pen",
  "LED Study Lamp", "Wired Mouse", "USB Pen Drive", "Plastic Food Container",
  "Smartphone Tripod", "Food Delivery Products"
];

import fs from 'fs';

const DB_FILE = path.join(__dirname, 'database.json');

let db = {
  teams: {} as Record<string, any>,
  globalSettings: {
    r1Open: false,
    r2Open: false,
    r3Open: false
  }
};

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    } catch (err) {
      console.error('Error loading DB:', err);
    }
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

loadDatabase();

function createNewTeam(teamId: string, teamName: string) {
  return {
    teamId,
    teamName,
    totalScore: 0,
    round1: {
      startTime: null, isCompleted: false, timeTaken: null,
      assignedId: null, questionId: null, attempts: 5, history: [],
      score: 0, logicScore: 0, accuracyScore: 0, autoScore: 0, finalAnswer: '', isCorrect: false
    },
    round2: {
      startTime: null, isCompleted: false, timeTaken: null,
      assignedId: null, challengeId: null, attempts: 0, flagAttempts: [],
      score: 0, flagScore: 0, pathScore: 0, methodScore: 0, autoScore: 0, submittedFlag: '', isCorrect: false
    },
    round3: {
      startTime: null, isCompleted: false, timeTaken: null,
      assignedId: null, productId: null, attempts: 0,
      problems: '', improvements: '', score: 0, 
      clarityScore: 0, creativityScore: 0, realismScore: 0, teamworkScore: 0
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cookieParser());
  
  // Serve static files from public
  app.use(express.static(path.join(__dirname, 'public')));

  // Middleware to ensure teamId
  app.use(async (req, res, next) => {
    let teamId = req.headers['x-team-id'] as string;
    if (!teamId) teamId = req.cookies.teamId;
    
    if (teamId) {
      req.teamId = teamId;
      req.team = db.teams[teamId];
    }
    next();
  });

  // API Routes - Admin Management
  app.post('/api/admin/toggle-round', async (req, res) => {
    const { round, isOpen } = req.body;
    if (round === 'r1') db.globalSettings.r1Open = isOpen;
    else if (round === 'r2') db.globalSettings.r2Open = isOpen;
    else if (round === 'r3') db.globalSettings.r3Open = isOpen;
    saveDatabase();
    res.json({ status: 'ok', globalSettings: db.globalSettings });
  });

  app.get('/api/admin/settings', async (req, res) => {
    res.json(db.globalSettings);
  });

  // API Routes - Registration/Login
  app.post('/api/login-participant', async (req, res) => {
    const { teamId, teamName } = req.body;
    if (!teamId) return res.status(400).json({ error: 'Team ID is required' });

    let team = db.teams[teamId];
    if (!team) {
      // Auto-register
      team = createNewTeam(teamId, teamName || 'Unknown');
      db.teams[teamId] = team;
      saveDatabase();
    }
    res.json({ status: 'ok', teamId });
  });

  // API Routes - Round 1
  app.post('/api/start', async (req, res) => {
    const team = req.team;
    if (!team) return res.status(400).json({ error: 'Session lost or team not found' });
    if (!db.globalSettings.r1Open) return res.status(403).json({ error: 'Round is locked by Admin' });
    
    if (team.round1.startTime) return res.json({ status: 'already_started', state: team.round1 });

    const randomQuestion = round1Questions[Math.floor(Math.random() * round1Questions.length)];
    team.round1.questionId = randomQuestion.id;
    team.round1.startTime = Date.now();
    
    saveDatabase();
    res.json({ status: 'ok', state: team.round1 });
  });

  app.post('/api/input', async (req, res) => {
    const team = req.team;
    const state = team?.round1;
    
    if (!state || !state.startTime) return res.status(400).json({ error: 'Round 1 not started' });
    if (state.attempts <= 0) return res.status(400).json({ error: 'No attempts left' });
    if (state.isCompleted) return res.status(400).json({ error: 'Round 1 already completed' });

    const input = Number(req.body.input);
    if (isNaN(input)) return res.status(400).json({ error: 'Invalid input' });

    const question = round1Questions.find(q => q.id === state.questionId);
    if (!question) return res.status(500).json({ error: 'Question not found' });

    const output = question.logic(input);
    state.attempts -= 1;
    state.history.push({
      attempt: 5 - state.attempts,
      input,
      output: parseFloat(output.toFixed(4))
    });

    saveDatabase();
    res.json({ status: 'ok', state });
  });

  app.post('/api/submit', async (req, res) => {
    const team = req.team;
    const state = team?.round1;

    if (!state || !state.startTime) return res.status(400).json({ error: 'Round 1 not started' });
    if (state.isCompleted) return res.status(400).json({ error: 'Round 1 already completed' });

    const answer = req.body.answer || '';
    const question = round1Questions.find(q => q.id === state.questionId);
    if (!question) return res.status(500).json({ error: 'Question not found' });

    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '').replace(/\*/g, '').replace(/n/g, 'x').replace(/f\(x\)=/g, '').replace(/y=/g, '');
    
    state.finalAnswer = answer;
    state.isCorrect = (normalize(answer) === normalize(question.answer));
    state.isCompleted = true;
    state.timeTaken = Math.floor((Date.now() - state.startTime) / 1000);

    if (state.isCorrect) state.autoScore = 25;
    state.score = state.manualScore + state.autoScore;
    team.totalScore = team.round1.score + team.round2.score + team.round3.score;

    saveDatabase();
    res.json({ status: 'ok', state });
  });

  // API Routes - Round 2
  app.post('/api/start-round2', async (req, res) => {
    const team = req.team;
    if (!team) return res.status(400).json({ error: 'Session lost or team not found' });
    if (!db.globalSettings.r2Open) return res.status(403).json({ error: 'Round is locked by Admin' });

    if (team.round2.startTime) return res.json({ status: 'already_started', state: team.round2 });

    const randomChallenge = round2Challenges[Math.floor(Math.random() * round2Challenges.length)];
    team.round2.challengeId = randomChallenge.id;
    team.round2.assignedId = randomChallenge.url;
    team.round2.startTime = Date.now();
    
    saveDatabase();
    res.json({ status: 'ok', state: team.round2 });
  });

  app.post('/api/round2/submit', async (req, res) => {
    const team = req.team;
    const state = team?.round2;

    if (!state || !state.startTime) return res.status(400).json({ error: 'Round 2 not started' });
    if (state.isCompleted) return res.status(400).json({ error: 'Round 2 already completed' });

    const flag = req.body.flag?.trim() || '';
    const challenge = round2Challenges.find(c => c.id === state.challengeId);
    
    state.flagAttempts.push(flag);
    state.submittedFlag = flag;
    state.isCorrect = (flag === challenge?.flag);
    
    if (state.isCorrect) {
      state.isCompleted = true;
      state.timeTaken = Math.floor((Date.now() - state.startTime) / 1000);
      state.autoScore = 25;
    }
    
    state.score = (state.manualScore || 0) + (state.autoScore || 0);
    team.totalScore = (team.round1.score || 0) + (team.round2.score || 0) + (team.round3.score || 0);

    saveDatabase();
    res.json({ status: 'ok', state });
  });

  // API Routes - Round 3
  app.post('/api/start-round3', async (req, res) => {
    const team = req.team;
    if (!team) return res.status(400).json({ error: 'Session lost or team not found' });
    if (!db.globalSettings.r3Open) return res.status(403).json({ error: 'Round is locked by Admin' });

    if (team.round3.startTime) return res.json({ status: 'already_started', state: team.round3 });

    const randomProduct = round3Products[Math.floor(Math.random() * round3Products.length)];
    team.round3.productId = randomProduct;
    team.round3.startTime = Date.now();
    
    saveDatabase();
    res.json({ status: 'ok', state: team.round3 });
  });

  app.post('/api/round3/submit', async (req, res) => {
    const team = req.team;
    const state = team?.round3;

    if (!state || !state.startTime) return res.status(400).json({ error: 'Round 3 not started' });
    if (state.isCompleted) return res.status(400).json({ error: 'Round 3 already completed' });
    
    state.problems = req.body.problems;
    state.improvements = req.body.improvements;
    state.isCompleted = true;
    state.timeTaken = Math.floor((Date.now() - state.startTime) / 1000);

    saveDatabase();
    res.json({ status: 'ok', state });
  });

  app.get('/api/status', async (req, res) => {
    const teamId = req.teamId;
    const team = db.teams[teamId];
    if (!team) {
      return res.json({ status: 'not_started' });
    }
    res.json({ status: 'ok', state: team, globalSettings: db.globalSettings });
  });

  // Admin APIs
  app.get('/api/admin/logs', async (req, res) => {
    const allTeams = Object.values(db.teams);
    const logs = allTeams.map(t => {
      const r1Q = round1Questions.find(q => q.id === t.round1.questionId);
      const r2C = round2Challenges.find(c => c.id === t.round2.challengeId);
      
      return {
        teamId: t.teamId,
        teamName: t.teamName,
        totalScore: t.totalScore,
        round1: {
          question: r1Q?.logic.toString() || 'N/A',
          correctAnswer: r1Q?.answer || 'N/A',
          finalAnswer: t.round1.finalAnswer,
          isCorrect: t.round1.isCorrect,
          attempts: 5 - t.round1.attempts,
          history: t.round1.history,
          isCompleted: t.round1.isCompleted,
          timeTaken: t.round1.timeTaken,
          score: t.round1.score,
          logicScore: t.round1.logicScore,
          accuracyScore: t.round1.accuracyScore,
          autoScore: t.round1.autoScore
        },
        round2: {
          url: t.round2.assignedId,
          correctFlag: r2C?.flag || 'N/A',
          currentFlag: t.round2.submittedFlag,
          isCorrect: t.round2.isCorrect,
          attempts: t.round2.flagAttempts,
          isCompleted: t.round2.isCompleted,
          timeTaken: t.round2.timeTaken,
          score: t.round2.score,
          flagScore: t.round2.flagScore,
          pathScore: t.round2.pathScore,
          methodScore: t.round2.methodScore,
          autoScore: t.round2.autoScore
        },
        round3: {
          product: t.round3.productId,
          problems: t.round3.problems,
          improvements: t.round3.improvements,
          expectedPoints: [
            "Durability assessment",
            "Ergonomic design improvements",
            "Material sustainability",
            "Cost-effective manufacturing"
          ],
          isCompleted: t.round3.isCompleted,
          timeTaken: t.round3.timeTaken,
          score: t.round3.score,
          clarityScore: t.round3.clarityScore,
          creativityScore: t.round3.creativityScore,
          realismScore: t.round3.realismScore,
          teamworkScore: t.round3.teamworkScore
        }
      };
    });
    res.json(logs);
  });

  app.post('/api/admin/score', async (req, res) => {
    const { 
      teamId, 
      r1Logic, r1Accuracy, 
      r2Flag, r2Path, r2Method, 
      r3Clarity, r3Creativity, r3Realism, r3Teamwork 
    } = req.body;
    
    const team = db.teams[teamId];
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Validate limits
    if (r1Logic > 25 || r1Accuracy > 25 ||
        r2Flag > 25 || r2Path > 15 || r2Method > 10 ||
        r3Clarity > 25 || r3Creativity > 25 || r3Realism > 25 || r3Teamwork > 25) {
      return res.status(400).json({ success: false, message: 'Marks exceed allowed limit' });
    }
    
    if (r1Logic !== undefined) team.round1.logicScore = Math.max(Number(r1Logic) || 0, 0);
    if (r1Accuracy !== undefined) team.round1.accuracyScore = Math.max(Number(r1Accuracy) || 0, 0);
    
    if (r2Flag !== undefined) team.round2.flagScore = Math.max(Number(r2Flag) || 0, 0);
    if (r2Path !== undefined) team.round2.pathScore = Math.max(Number(r2Path) || 0, 0);
    if (r2Method !== undefined) team.round2.methodScore = Math.max(Number(r2Method) || 0, 0);
    
    if (r3Clarity !== undefined) team.round3.clarityScore = Math.max(Number(r3Clarity) || 0, 0);
    if (r3Creativity !== undefined) team.round3.creativityScore = Math.max(Number(r3Creativity) || 0, 0);
    if (r3Realism !== undefined) team.round3.realismScore = Math.max(Number(r3Realism) || 0, 0);
    if (r3Teamwork !== undefined) team.round3.teamworkScore = Math.max(Number(r3Teamwork) || 0, 0);
    
    team.round1.score = team.round1.logicScore + team.round1.accuracyScore + team.round1.autoScore;
    team.round2.score = team.round2.flagScore + team.round2.pathScore + team.round2.methodScore + team.round2.autoScore;
    team.round3.score = team.round3.clarityScore + team.round3.creativityScore + team.round3.realismScore + team.round3.teamworkScore;

    team.totalScore = team.round1.score + team.round2.score + team.round3.score;
    
    saveDatabase();
    res.json({ success: true, status: 'ok', state: team });
  });

  app.delete('/api/admin/team/:teamId', async (req, res) => {
    const teamId = req.params.teamId;
    if (db.teams[teamId]) {
      delete db.teams[teamId];
      saveDatabase();
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Team not found' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
