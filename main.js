"use strict";

const CONFIG = {
  canvasWidth: 960,
  canvasHeight: 540,
  hoopX: 496,
  hoopY: 140,
  hoopSize: 192,
  rimRadius: 26,
  ballRadius: 14,
  minX: 120,
  maxX: 840,
  threePointDistanceX: 230,
  ballSpeed: 420,
  powerSpeed: 1.6,
  shotDuration: 0.65,
  swishPause: 0.12,
  swishDropDuration: 0.22,
  swishDropDistance: 130,
  arcHeight: 150,
  makeSoundEarlySeconds: 0.5,
  ticketSeconds: 30,
  boxDropChance: 0.05,
  threePointBoxBonusChance: 0.04,
  singleQuestionMode: false,
  singleQuestionIndex: 0
};

const SKINS = [
  { id: "classic", name: "Classic", rarity: "common", file: "Classic.png", color: "#d9882c" },
  { id: "baseball", name: "Baseball", rarity: "common", file: "Baseball.png", color: "#d9882c" },
  { id: "donut", name: "Donut", rarity: "common", file: "Donut.png", color: "#d9882c" },
  { id: "kickball", name: "Kickball", rarity: "common", file: "kickball.png", color: "#d9882c" },
  { id: "rock", name: "Rock", rarity: "common", file: "rock.png", color: "#d9882c" },
  { id: "soccer", name: "Soccer", rarity: "common", file: "Soccer.png", color: "#d9882c" },
  { id: "tennis-ball", name: "Tennis Ball", rarity: "common", file: "tennis ball.png", color: "#d9882c" },
  { id: "volleyball", name: "Volleyball", rarity: "common", file: "Volleyball.png", color: "#d9882c" },

  { id: "chromebook", name: "Chromebook", rarity: "rare", file: "chromebook.png", color: "#3a6bd2" },
  { id: "clorox-wipes", name: "Clorox Wipes", rarity: "rare", file: "clorox wipes.png", color: "#3a6bd2" },
  { id: "stick", name: "Stick", rarity: "rare", file: "stick.png", color: "#3a6bd2" },
  { id: "water-bottle", name: "Water Bottle", rarity: "rare", file: "Water Bottle.png", color: "#3a6bd2" },

  { id: "coltyn", name: "Coltyn", rarity: "legendary", file: "Coltyn.png", color: "#a1452a" },
  { id: "grace", name: "Grace", rarity: "legendary", file: "Grace.png", color: "#a1452a" },
  { id: "landyn-da-goat", name: "Landyn da GOAT", rarity: "legendary", file: "Landyn da GOAT.png", color: "#a1452a" },
  { id: "lucy", name: "Lucy", rarity: "legendary", file: "Lucy.png", color: "#a1452a" }
];

const SAVE_KEY = "arcade_free_throw.save.v1";
const QUESTION_SET_KEY = "arcade_free_throw.question_set";
const ADMIN_MODE_KEY = "arcade_free_throw.admin_mode";

const QUESTION_SETS = {
  grade7: {
    label: "7th grade questions",
    file: "data/questions_grade7.json"
  },
  grade7_advanced: {
    label: "7th advanced",
    file: "data/questions_grade7_advanced.json"
  },
  isat: {
    label: "ISAT",
    file: "data/questions_isat.json"
  }
};

const LOOT_TABLE = {
  regular: { common: 1, rare: 0, legendary: 0 },
  fancy: { common: 0.7, rare: 0.25, legendary: 0.05 }
};

const SPRITE_PATHS = {
  court: "assets/court_bg.png",
  hoop: "assets/hoop.png",
  ballSkinsRoot: "assets/ball_skins"
};

const SFX = {
  coltynMake: new Audio("assets/sfx/Coltyn.mp3"),
  swish: new Audio("assets/sfx/Voicy_Basketball Swish.mp3")
};
SFX.coltynMake.preload = "auto";
SFX.coltynMake.volume = 0.7;
SFX.swish.preload = "auto";
SFX.swish.volume = 0.7;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const ticketsEl = document.getElementById("tickets-count");
const timeEl = document.getElementById("time-remaining");
const scoreEl = document.getElementById("score");
const boxesEl = document.getElementById("boxes-count");
const trophyEl = document.getElementById("trophy-case");
const spriteStatusEl = document.getElementById("sprite-status");

const earnTicketBtn = document.getElementById("earn-ticket-btn");
const startSessionBtn = document.getElementById("start-session-btn");
const homeBtn = document.getElementById("home-btn");
const lockoutStatusEl = document.getElementById("lockout-status");
const unlockAllBtn = document.getElementById("unlock-all-btn");
const adminBtn = document.getElementById("admin-btn");
const adminStatusEl = document.getElementById("admin-status");

const questionModal = document.getElementById("question-modal");
const questionTitle = document.getElementById("question-title");
const questionText = document.getElementById("question-text");
const questionOptions = document.getElementById("question-options");
const questionFeedback = document.getElementById("question-feedback");
const questionContinue = document.getElementById("question-continue");

const sessionModal = document.getElementById("session-end");
const sessionSummary = document.getElementById("session-summary");
const boxList = document.getElementById("box-list");
const sessionClose = document.getElementById("session-close");

const lootModal = document.getElementById("loot-modal");
const lootSpriteEl = document.getElementById("loot-sprite");
const lootNameEl = document.getElementById("loot-name");
const lootRarityEl = document.getElementById("loot-rarity");
const lootCloseBtn = document.getElementById("loot-close");

const homeMenuEl = document.getElementById("home-menu");
const gameScreenEl = document.getElementById("game-screen");

const state = {
  tickets: 0,
  timeRemaining: 0,
  score: 0,
  boxes: 0,
  boxesList: [],
  inventory: [],
  equippedSkin: "classic",
  spriteCache: { court: null, hoop: null, balls: {} },
  spriteStatus: { court: "loading", hoop: "loading", balls: {} },
  mode: "idle",
  ballX: CONFIG.minX,
  ballY: CONFIG.canvasHeight - 60,
  ballDir: 1,
  powerValue: 0,
  powerDir: 1,
  shot: null,
  questionPool: [],
  currentQuestion: null,
  questionContext: null,
  questionLocked: false,
  adminMode: false,
  wrongStreak: 0,
  answerLockoutUntil: 0,
  lastLoot: null,
  selectedQuestionSet: "grade7",
  questionPoolSeed: []
};

let lastTime = 0;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function playMakeBasketSfx() {
  const isLegendarySkin =
    state.equippedSkin === "coltyn" ||
    state.equippedSkin === "grace" ||
    state.equippedSkin === "landyn-da-goat" ||
    state.equippedSkin === "lucy";

  try {
    if (state.equippedSkin === "coltyn") {
      SFX.coltynMake.currentTime = 0;
      void SFX.coltynMake.play();
    } else if (!isLegendarySkin) {
      SFX.swish.currentTime = 0;
      void SFX.swish.play();
    }
  } catch (error) {
    // Ignore audio failures (e.g. autoplay restrictions).
  }
}

function getShotElapsedFromStart(shot) {
  if (!shot) {
    return 0;
  }
  if (shot.phase === "arc") {
    return shot.elapsed || 0;
  }
  if (shot.phase === "pause") {
    return CONFIG.shotDuration + (shot.pauseElapsed || 0);
  }
  if (shot.phase === "drop") {
    return CONFIG.shotDuration + CONFIG.swishPause + (shot.dropElapsed || 0);
  }
  return 0;
}

function getLockoutSecondsRemaining() {
  const remainingMs = state.answerLockoutUntil - Date.now();
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

function isAnswerLockoutActive() {
  return getLockoutSecondsRemaining() > 0;
}

async function loadQuestions(setKey) {
  const config = QUESTION_SETS[setKey];
  if (!config) {
    return { questions: [], error: "unknown-set" };
  }
  try {
    const response = await fetch(config.file);
    if (!response.ok) {
      throw new Error("load failed");
    }
    const data = await response.json();
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) {
      return { questions: [], error: "empty" };
    }
    if (CONFIG.singleQuestionMode) {
      const chosen = questions[CONFIG.singleQuestionIndex] || questions[0];
      return { questions: chosen ? [chosen] : [], error: chosen ? null : "empty" };
    }
    return { questions, error: null };
  } catch (error) {
    return { questions: [], error: "load-failed" };
  }
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawCourt() {
  if (state.spriteCache.court) {
    ctx.drawImage(
      state.spriteCache.court,
      0,
      0,
      CONFIG.canvasWidth,
      CONFIG.canvasHeight
    );
  } else {
    ctx.fillStyle = "#f3e6cd";
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    ctx.strokeStyle = "#d8c4a0";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, CONFIG.canvasWidth - 40, CONFIG.canvasHeight - 40);
  }
}

function drawHoop() {
  if (state.spriteCache.hoop) {
    const img = state.spriteCache.hoop;
    ctx.drawImage(
      img,
      CONFIG.hoopX - CONFIG.hoopSize / 2,
      CONFIG.hoopY - CONFIG.hoopSize / 2,
      CONFIG.hoopSize,
      CONFIG.hoopSize
    );
    return;
  }
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(CONFIG.hoopX - 40, CONFIG.hoopY - 40, 80, 16);

  ctx.strokeStyle = "#c14a2c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(CONFIG.hoopX, CONFIG.hoopY, CONFIG.rimRadius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBall() {
  const skin = SKINS.find((item) => item.id === state.equippedSkin) || SKINS[0];
  const sprite = state.spriteCache.balls[skin.id];
  if (sprite) {
    ctx.drawImage(
      sprite,
      state.ballX - sprite.width / 2,
      state.ballY - sprite.height / 2
    );
    return;
  }
  ctx.fillStyle = skin.color;
  ctx.beginPath();
  ctx.arc(state.ballX, state.ballY, CONFIG.ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPowerBar() {
  const barX = CONFIG.canvasWidth - 60;
  const barY = 120;
  const barHeight = 280;
  const indicatorY = barY + (1 - state.powerValue) * barHeight;

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(barX, barY, 14, barHeight);
  ctx.fillStyle = "#d2873a";
  ctx.fillRect(barX, indicatorY - 8, 14, 16);

  ctx.fillStyle = "#2b2319";
  ctx.font = "12px Trebuchet MS";
  ctx.fillText("Power", barX - 8, barY - 10);
}

function updateStats() {
  ticketsEl.textContent = state.tickets;
  timeEl.textContent = Math.max(0, Math.ceil(state.timeRemaining));
  scoreEl.textContent = state.score;
  boxesEl.textContent = state.boxes;
  startSessionBtn.disabled = state.tickets === 0 || state.mode !== "idle";

  if (adminStatusEl) {
    adminStatusEl.textContent = state.adminMode
      ? "Admin mode: ON (tickets don't require questions)"
      : "";
  }

  if (adminBtn) {
    adminBtn.textContent = state.adminMode ? "Admin (ON)" : "Admin (OFF)";
  }

  if (lockoutStatusEl) {
    const remaining = getLockoutSecondsRemaining();
    lockoutStatusEl.textContent =
      remaining > 0
        ? `Locked out: ${remaining}s (2 wrong in a row)`
        : "";
  }

  earnTicketBtn.disabled =
    (!state.adminMode && isAnswerLockoutActive()) ||
    state.mode !== "idle" ||
    (questionModal && !questionModal.classList.contains("hidden"));

  if (boxList) {
    boxList.querySelectorAll('button[data-open][data-type="fancy"]').forEach((button) => {
      button.disabled = isAnswerLockoutActive();
    });
  }
}

function setMode(mode) {
  state.mode = mode;
}

function startSession() {
  if (state.tickets === 0 || state.mode !== "idle") {
    return;
  }
  state.timeRemaining = state.tickets * CONFIG.ticketSeconds;
  state.tickets = 0;
  state.score = 0;
  state.boxes = 0;
  state.boxesList = [];
  state.ballX = CONFIG.minX;
  state.ballDir = 1;
  setMode("aim");
  updateTrophyCase();
}

function endSession() {
  setMode("idle");
  state.timeRemaining = 0;
  state.boxesList = Array.from({ length: state.boxes }, (_, i) => ({
    id: `box-${i}`,
    opened: false
  }));
  renderSessionSummary();
  sessionModal.classList.remove("hidden");
}

function renderSessionSummary() {
  sessionSummary.innerHTML = `
    <div>Score: <strong>${state.score}</strong></div>
    <div>Boxes earned: <strong>${state.boxes}</strong></div>
  `;
  renderBoxList();
}

function renderBoxList() {
  if (state.boxesList.length === 0) {
    boxList.innerHTML = "<div>No boxes earned this session.</div>";
    return;
  }
  boxList.innerHTML = state.boxesList
    .map((box, index) => {
      if (box.opened) {
        return `<div>Box ${index + 1}: Opened</div>`;
      }
      return `
        <div class="trophy-item">
          <span>Box ${index + 1}</span>
          <div>
            <button data-open="${index}" data-type="regular">Open</button>
            <button data-open="${index}" data-type="fancy">Upgrade</button>
          </div>
        </div>
      `;
    })
    .join("");

  boxList.querySelectorAll("button[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.open);
      const type = button.dataset.type;
      if (type === "regular") {
        openBox(index, "regular");
      } else {
        showQuestion("fancy", index);
      }
    });
  });
}

function openBox(index, type) {
  const box = state.boxesList[index];
  if (!box || box.opened) {
    return;
  }
  const rarity = rollRarity(type);
  const loot = getLootByRarity(rarity);
  box.opened = true;
  addSkinToInventory(loot.id);
  state.equippedSkin = loot.id;
  saveProgress();
  updateTrophyCase();
  renderBoxList();
  showLootReveal(loot);
}

function rollRarity(type) {
  const table = LOOT_TABLE[type];
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of ["common", "rare", "legendary"]) {
    cumulative += table[rarity];
    if (roll <= cumulative) {
      return rarity;
    }
  }
  return "common";
}

function getLootByRarity(rarity) {
  const pool = SKINS.filter((skin) => skin.rarity === rarity);
  const usablePool = pool.length ? pool : SKINS;
  const owned = new Set(state.inventory);
  const unowned = usablePool.filter((skin) => !owned.has(skin.id));
  const pickFrom = unowned.length ? unowned : usablePool;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

function updateTrophyCase() {
  if (state.inventory.length === 0) {
    trophyEl.innerHTML = "<div>No skins yet.</div>";
    return;
  }
  trophyEl.innerHTML = state.inventory
    .map((skinId) => {
      const skin = SKINS.find((item) => item.id === skinId) || {
        id: skinId,
        name: skinId,
        rarity: "common"
      };
      const equipped = skin.id === state.equippedSkin ? " (Equipped)" : "";
      return `
        <div class="trophy-item">
          <span class="rarity-${skin.rarity}">${skin.name}${equipped}</span>
          <button data-equip="${skin.id}">Equip</button>
        </div>
      `;
    })
    .join("");

  trophyEl.querySelectorAll("button[data-equip]").forEach((button) => {
    button.addEventListener("click", () => {
      state.equippedSkin = button.dataset.equip;
      saveProgress();
      updateTrophyCase();
    });
  });
}

function updateSpriteStatus() {
  const loadedBalls = Object.values(state.spriteStatus.balls).filter(
    (value) => value === "ok"
  ).length;
  const totalBalls = SKINS.length;
  const court = state.spriteStatus.court;
  const hoop = state.spriteStatus.hoop;
  spriteStatusEl.textContent =
    `Sprites - Court: ${court}, Hoop: ${hoop}, Balls: ${loadedBalls}/${totalBalls}`;
}

function showLootReveal(loot) {
  if (!loot) {
    return;
  }
  state.lastLoot = loot;
  lootNameEl.textContent = loot.name || loot.id;
  lootRarityEl.textContent = `Rarity: ${loot.rarity || "common"}`;
  lootRarityEl.className = `rarity-${loot.rarity || "common"}`;

  const sprite = state.spriteCache.balls[loot.id];
  if (sprite) {
    lootSpriteEl.src = sprite.src;
    lootSpriteEl.classList.remove("hidden");
  } else {
    lootSpriteEl.classList.add("hidden");
  }

  lootModal.classList.remove("hidden");
}

function renderHomeMenu() {
  homeMenuEl.innerHTML = `
    <div class="home-card">
      <div class="home-title">Choose Your Question Set</div>
      <div class="home-buttons">
        <button id="set-grade7">${QUESTION_SETS.grade7.label}</button>
        <button id="set-grade7-advanced">${QUESTION_SETS.grade7_advanced.label}</button>
        <button id="set-isat">${QUESTION_SETS.isat.label}</button>
      </div>
      <div id="home-status"></div>
    </div>
  `;

  document
    .getElementById("set-grade7")
    .addEventListener("click", () => setQuestionSet("grade7"));
  document
    .getElementById("set-grade7-advanced")
    .addEventListener("click", () => setQuestionSet("grade7_advanced"));
  document
    .getElementById("set-isat")
    .addEventListener("click", () => setQuestionSet("isat"));
}

function showHomeMenu(message) {
  setMode("idle");
  homeMenuEl.classList.remove("hidden");
  gameScreenEl.classList.add("hidden");
  questionModal.classList.add("hidden");
  sessionModal.classList.add("hidden");
  lootModal.classList.add("hidden");
  const statusEl = document.getElementById("home-status");
  if (statusEl) {
    if (message) {
      statusEl.textContent = message;
    } else if (QUESTION_SETS[state.selectedQuestionSet]) {
      statusEl.textContent = `Selected: ${QUESTION_SETS[state.selectedQuestionSet].label}`;
    } else {
      statusEl.textContent = "";
    }
  }
}

function showGameScreen() {
  homeMenuEl.classList.add("hidden");
  gameScreenEl.classList.remove("hidden");
}

async function setQuestionSet(key) {
  state.selectedQuestionSet = key;
  try {
    localStorage.setItem(QUESTION_SET_KEY, key);
  } catch (error) {
    // Ignore storage failures.
  }

  showHomeMenu("Loading...");
  const result = await loadQuestions(key);
  if (!result.questions.length) {
    showHomeMenu("Coming soon.");
    return;
  }

  state.questionPoolSeed = result.questions;
  state.questionPool = shuffle(result.questions);
  showGameScreen();
}

function showQuestion(context, payload) {
  if (state.questionLocked) {
    return;
  }
  if (isAnswerLockoutActive()) {
    updateStats();
    return;
  }
  if (!state.questionPoolSeed.length) {
    showHomeMenu("No questions available.");
    return;
  }
  if (!state.questionPool.length) {
    state.questionPool = shuffle(state.questionPoolSeed);
  }
  const question = state.questionPool.pop();
  state.currentQuestion = question;
  state.questionContext = { type: context, payload };
  state.questionLocked = false;

  questionTitle.textContent =
    context === "ticket" ? "Earn Ticket" : "Fancy Box Upgrade";
  questionText.textContent = question.prompt;
  questionOptions.innerHTML = "";
  questionFeedback.classList.add("hidden");
  questionContinue.classList.add("hidden");

  if (question.type === "mcq") {
    question.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.textContent = choice;
      button.addEventListener("click", () => handleAnswer(choice));
      questionOptions.appendChild(button);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type your answer";
    const submit = document.createElement("button");
    submit.textContent = "Submit";
    submit.addEventListener("click", () => handleAnswer(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleAnswer(input.value);
      }
    });
    questionOptions.appendChild(input);
    questionOptions.appendChild(submit);
    input.focus();
  }

  questionModal.classList.remove("hidden");
}

function handleAnswer(rawAnswer) {
  if (!state.currentQuestion || state.questionLocked) {
    return;
  }
  state.questionLocked = true;
  const normalized = String(rawAnswer).trim().toLowerCase();
  const correct =
    normalized === String(state.currentQuestion.answer).trim().toLowerCase();

  questionOptions.innerHTML = "";
  questionFeedback.classList.remove("hidden");
  questionContinue.classList.remove("hidden");
  questionFeedback.textContent = correct
    ? "Correct!"
    : `Incorrect. Correct answer: ${state.currentQuestion.answer}`;

  questionContinue.onclick = () => {
    questionModal.classList.add("hidden");
    resolveQuestion(correct);
  };
}

function resolveQuestion(correct) {
  const context = state.questionContext;
  state.currentQuestion = null;
  state.questionContext = null;
  state.questionLocked = false;

  if (correct) {
    state.wrongStreak = 0;
  } else {
    state.wrongStreak += 1;
    if (state.wrongStreak >= 2) {
      state.wrongStreak = 0;
      state.answerLockoutUntil = Date.now() + 15000;
    }
  }

  if (!correct) {
    updateStats();
    return;
  }

  if (context.type === "ticket") {
    state.tickets += 1;
    updateStats();
  }

  if (context.type === "fancy") {
    openBox(context.payload, "fancy");
  }
}

function handleSpace() {
  if (state.mode === "aim") {
    setMode("power");
    state.powerValue = 0;
    state.powerDir = 1;
    return;
  }

  if (state.mode === "power") {
    takeShot();
  }
}

function takeShot() {
  const maxDist = Math.max(
    Math.abs(CONFIG.minX - CONFIG.hoopX),
    Math.abs(CONFIG.maxX - CONFIG.hoopX)
  );
  const normDist = maxDist === 0 ? 0 : Math.abs(state.ballX - CONFIG.hoopX) / maxDist;
  const requiredPower = lerp(0.4, 0.9, clamp(normDist, 0, 1));
  const window = lerp(0.24, 0.1, clamp(normDist, 0, 1));
  const diff = state.powerValue - requiredPower;
  const success = Math.abs(diff) <= window / 2;
  const missOffset = diff < 0 ? 80 : -80;
  const points = isThreePointer(state.ballX) ? 3 : 2;

  state.shot = {
    phase: "arc",
    startX: state.ballX,
    startY: state.ballY,
    endX: CONFIG.hoopX,
    endY: success ? CONFIG.hoopY : CONFIG.hoopY + missOffset,
    elapsed: 0,
    success,
    points,
    sfxPlayed: false,
    pauseElapsed: 0,
    dropElapsed: 0
  };
  setMode("shot");
}

function resolveShot() {
  if (state.shot.success) {
    state.score += state.shot.points;
    const bonus = state.shot.points === 3 ? CONFIG.threePointBoxBonusChance : 0;
    if (Math.random() < CONFIG.boxDropChance + bonus) {
      state.boxes += 1;
    }
  }
  state.ballX = lerp(CONFIG.minX, CONFIG.maxX, Math.random());
  state.ballY = CONFIG.canvasHeight - 60;
  state.ballDir = Math.random() > 0.5 ? 1 : -1;
  state.shot = null;
  setMode("aim");
}

function isThreePointer(x) {
  return Math.abs(x - CONFIG.hoopX) >= CONFIG.threePointDistanceX;
}

function update(delta) {
  if (state.mode === "aim") {
    state.ballX += state.ballDir * CONFIG.ballSpeed * delta;
    if (state.ballX <= CONFIG.minX || state.ballX >= CONFIG.maxX) {
      state.ballDir *= -1;
      state.ballX = clamp(state.ballX, CONFIG.minX, CONFIG.maxX);
    }
  }

  if (state.mode === "power") {
    state.powerValue += state.powerDir * CONFIG.powerSpeed * delta;
    if (state.powerValue >= 1 || state.powerValue <= 0) {
      state.powerDir *= -1;
      state.powerValue = clamp(state.powerValue, 0, 1);
    }
  }

  if (state.mode === "shot" && state.shot) {
    if (state.shot.phase === "arc") {
      state.shot.elapsed += delta;
      const t = clamp(state.shot.elapsed / CONFIG.shotDuration, 0, 1);
      const arc = CONFIG.arcHeight * Math.sin(Math.PI * t);
      state.ballX = lerp(state.shot.startX, state.shot.endX, t);
      state.ballY = lerp(state.shot.startY, state.shot.endY, t) - arc;
      if (t >= 1) {
        if (state.shot.success) {
          state.shot.phase = "pause";
          state.shot.pauseElapsed = 0;
          state.ballX = CONFIG.hoopX;
          state.ballY = CONFIG.hoopY;
        } else {
          resolveShot();
        }
      }
    } else if (state.shot.phase === "pause") {
      state.shot.pauseElapsed += delta;
      state.ballX = CONFIG.hoopX;
      state.ballY = CONFIG.hoopY;
      if (state.shot.pauseElapsed >= CONFIG.swishPause) {
        state.shot.phase = "drop";
        state.shot.dropElapsed = 0;
      }
    } else if (state.shot.phase === "drop") {
      state.shot.dropElapsed += delta;
      const t = clamp(state.shot.dropElapsed / CONFIG.swishDropDuration, 0, 1);
      state.ballX = CONFIG.hoopX;
      state.ballY = CONFIG.hoopY + t * CONFIG.swishDropDistance;
      if (t >= 1) {
        resolveShot();
      }
    }

    if (state.shot && state.shot.success && !state.shot.sfxPlayed) {
      const totalShotSeconds =
        CONFIG.shotDuration + CONFIG.swishPause + CONFIG.swishDropDuration;
      const playAtSeconds = Math.max(
        0,
        totalShotSeconds - CONFIG.makeSoundEarlySeconds
      );
      if (getShotElapsedFromStart(state.shot) >= playAtSeconds) {
        playMakeBasketSfx();
        state.shot.sfxPlayed = true;
      }
    }
  }

  if (state.mode !== "idle") {
    state.timeRemaining -= delta;
    if (state.timeRemaining <= 0) {
      endSession();
    }
  }
}

function render() {
  drawCourt();
  drawHoop();
  drawBall();
  if (state.mode === "power") {
    drawPowerBar();
  }
}

function loop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (state.mode !== "idle") {
    update(delta);
  }
  render();
  updateStats();
  requestAnimationFrame(loop);
}

function attachEvents() {
  earnTicketBtn.addEventListener("click", () => {
    if (state.adminMode) {
      state.tickets += 1;
      updateStats();
      return;
    }
    showQuestion("ticket");
  });
  startSessionBtn.addEventListener("click", startSession);
  sessionClose.addEventListener("click", () => {
    sessionModal.classList.add("hidden");
  });
  homeBtn.addEventListener("click", () => {
    showHomeMenu();
  });
  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      const password = prompt("Admin password:");
      if (password !== "Kautz6460") {
        alert("Incorrect password.");
        return;
      }
      state.adminMode = !state.adminMode;
      try {
        localStorage.setItem(ADMIN_MODE_KEY, state.adminMode ? "1" : "0");
      } catch (error) {
        // Ignore storage failures.
      }
      updateStats();
      alert(`Admin mode ${state.adminMode ? "enabled" : "disabled"}.`);
    });
  }
  lootCloseBtn.addEventListener("click", () => {
    lootModal.classList.add("hidden");
  });
  if (unlockAllBtn) {
    unlockAllBtn.addEventListener("click", () => {
      const password = prompt("Password required:");
      if (password !== "Kautz6460") {
        alert("Incorrect password.");
        return;
      }

      state.inventory = Array.from(new Set(SKINS.map((skin) => skin.id)));
      if (!state.inventory.includes(state.equippedSkin)) {
        state.equippedSkin = state.inventory[0] || "classic";
      }
      saveProgress();
      updateTrophyCase();
      alert("All skins unlocked.");
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") {
      return;
    }
    if (!questionModal.classList.contains("hidden") || !sessionModal.classList.contains("hidden")) {
      return;
    }
    if (state.mode === "idle") {
      return;
    }
    event.preventDefault();
    handleSpace();
  });
}

async function init() {
  ctx.imageSmoothingEnabled = false;
  loadProgress();
  state.selectedQuestionSet =
    localStorage.getItem(QUESTION_SET_KEY) || "grade7";
  state.adminMode = localStorage.getItem(ADMIN_MODE_KEY) === "1";
  renderHomeMenu();
  showHomeMenu();
  await preloadSprites();
  updateStats();
  updateTrophyCase();
  attachEvents();
  requestAnimationFrame(loop);
}

init();

function addSkinToInventory(skinId) {
  if (!skinId) {
    return;
  }
  if (!state.inventory.includes(skinId)) {
    state.inventory.push(skinId);
  }
}

function loadProgress() {
  const defaultSkinId = SKINS[0]?.id || "classic";
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      state.inventory = [defaultSkinId];
      state.equippedSkin = defaultSkinId;
      return;
    }
    const parsed = JSON.parse(raw);
    const available = new Set(SKINS.map((skin) => skin.id));
    const unlocked = Array.isArray(parsed.unlocked) ? parsed.unlocked : [];
    const filtered = unlocked.filter((id) => available.has(id));
    state.inventory = filtered.length ? filtered : [defaultSkinId];
    state.equippedSkin =
      available.has(parsed.equipped) && parsed.equipped
        ? parsed.equipped
        : state.inventory[0];
  } catch (error) {
    state.inventory = [defaultSkinId];
    state.equippedSkin = defaultSkinId;
  }
}

function saveProgress() {
  try {
    const unlocked = Array.from(new Set(state.inventory));
    const payload = {
      unlocked,
      equipped: state.equippedSkin
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore save failures (e.g. blocked storage).
  }
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function preloadSprites() {
  state.spriteCache.court = await loadImage(SPRITE_PATHS.court);
  state.spriteStatus.court = state.spriteCache.court ? "ok" : "missing";
  state.spriteCache.hoop = await loadImage(SPRITE_PATHS.hoop);
  state.spriteStatus.hoop = state.spriteCache.hoop ? "ok" : "missing";
  for (const skin of SKINS) {
    const file = skin.file || `${skin.id}.png`;
    const src = `${SPRITE_PATHS.ballSkinsRoot}/${skin.rarity}/${file}`;
    const img = await loadImage(src);
    state.spriteCache.balls[skin.id] = img;
    state.spriteStatus.balls[skin.id] = img ? "ok" : "missing";
  }
  updateSpriteStatus();
}
