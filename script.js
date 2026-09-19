/* ============================================
   BRICK BREAKER — PREMIUM NEON RED THEME
   Vanilla JS game logic, 60 FPS via requestAnimationFrame
   ============================================ */

(function () {
  "use strict";

  // ---------- Canvas setup ----------
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");

  // Logical (internal) resolution stays fixed; CSS scales the element.
  var LOGICAL_WIDTH = canvas.width;   // 720
  var LOGICAL_HEIGHT = canvas.height; // 480

  // ---------- Colors ----------
  var COLORS = {
    neonRed: "#FF003C",
    darkRed: "#B00020",
    accentRed: "#FF4D6D",
    borderGlow: "#FF1744",
    white: "#FFFFFF",
    secondary: "#BBBBBB",
    bg: "#0A0A0A"
  };

  // Multiple shades of red for brick rows
  var BRICK_SHADES = ["#FF1744", "#DC143C", "#FF2400", "#B00020", "#E0115F"];
  // Bright Red, Crimson, Scarlet, Deep Red, Ruby

  // ---------- DOM refs ----------
  var scoreValueEl = document.getElementById("scoreValue");
  var livesValueEl = document.getElementById("livesValue");
  var levelValueEl = document.getElementById("levelValue");

  var overlayStart = document.getElementById("overlayStart");
  var overlayPause = document.getElementById("overlayPause");
  var overlayGameOver = document.getElementById("overlayGameOver");
  var overlayWin = document.getElementById("overlayWin");
  var gameOverScoreEl = document.getElementById("gameOverScore");
  var winScoreEl = document.getElementById("winScore");

  var btnStart = document.getElementById("btnStart");
  var btnPause = document.getElementById("btnPause");
  var btnRestart = document.getElementById("btnRestart");
  var btnOverlayStart = document.getElementById("btnOverlayStart");
  var btnOverlayResume = document.getElementById("btnOverlayResume");
  var btnOverlayRestartFromLoss = document.getElementById("btnOverlayRestartFromLoss");
  var btnOverlayNext = document.getElementById("btnOverlayNext");

  // ---------- Game state ----------
  var STATE = {
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    GAME_OVER: "gameover",
    WON: "won"
  };

  var state = STATE.IDLE;

  var score = 0;
  var lives = 3;
  var level = 1;

  var ballRadius = 9;
  var paddleHeight = 12;
  var paddleWidth = 100;
  var paddleX = (LOGICAL_WIDTH - paddleWidth) / 2;

  var baseSpeed = 4;
  var x, y, dx, dy;

  var rightPressed = false;
  var leftPressed = false;

  var brickRowCount = 5;
  var brickColumnCount = 8;
  var brickPadding = 8;
  var brickOffsetTop = 50;
  var brickOffsetLeft = 20;
  var brickWidth, brickHeight;

  var bricks = [];
  var bricksRemaining = 0;

  // ---------- Helpers ----------
  function resetBallAndPaddle() {
    paddleWidth = 100;
    paddleX = (LOGICAL_WIDTH - paddleWidth) / 2;
    x = LOGICAL_WIDTH / 2;
    y = LOGICAL_HEIGHT - 40;
    var speed = baseSpeed + (level - 1) * 0.6;
    dx = speed * (Math.random() < 0.5 ? -1 : 1);
    dy = -speed;
  }

  function buildBricks() {
    brickWidth = (LOGICAL_WIDTH - brickOffsetLeft * 2 - brickPadding * (brickColumnCount - 1)) / brickColumnCount;
    brickHeight = 20;
    bricks = [];
    bricksRemaining = 0;
    for (var c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (var r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
        bricksRemaining++;
      }
    }
  }

  function updateHud() {
    scoreValueEl.textContent = score;
    livesValueEl.textContent = lives;
    levelValueEl.textContent = level;
  }

  function hideAllOverlays() {
    overlayStart.classList.add("hidden");
    overlayPause.classList.add("hidden");
    overlayGameOver.classList.add("hidden");
    overlayWin.classList.add("hidden");
  }

  function setButtonsForState() {
    if (state === STATE.RUNNING) {
      btnStart.disabled = true;
      btnPause.disabled = false;
      btnPause.textContent = "Pause";
    } else if (state === STATE.PAUSED) {
      btnStart.disabled = true;
      btnPause.disabled = false;
      btnPause.textContent = "Resume";
    } else {
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnPause.textContent = "Pause";
    }
  }

  // ---------- Drawing ----------
  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();
  }

  function drawPaddle() {
    var px = paddleX;
    var py = LOGICAL_HEIGHT - paddleHeight - 6;
    var r = 6;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + paddleWidth, py, px + paddleWidth, py + paddleHeight, r);
    ctx.arcTo(px + paddleWidth, py + paddleHeight, px, py + paddleHeight, r);
    ctx.arcTo(px, py + paddleHeight, px, py, r);
    ctx.arcTo(px, py, px + paddleWidth, py, r);
    ctx.closePath();
    ctx.fillStyle = COLORS.neonRed;
    ctx.shadowColor = "rgba(255,0,60,0.6)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
      for (var r = 0; r < brickRowCount; r++) {
        var b = bricks[c][r];
        if (b.status === 1) {
          var brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          var brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          b.x = brickX;
          b.y = brickY;

          ctx.beginPath();
          var rad = 4;
          ctx.moveTo(brickX + rad, brickY);
          ctx.arcTo(brickX + brickWidth, brickY, brickX + brickWidth, brickY + brickHeight, rad);
          ctx.arcTo(brickX + brickWidth, brickY + brickHeight, brickX, brickY + brickHeight, rad);
          ctx.arcTo(brickX, brickY + brickHeight, brickX, brickY, rad);
          ctx.arcTo(brickX, brickY, brickX + brickWidth, brickY, rad);
          ctx.closePath();
          ctx.fillStyle = BRICK_SHADES[r % BRICK_SHADES.length];
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.25)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function clear() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  // ---------- Collision ----------
  function collisionDetection() {
    for (var c = 0; c < brickColumnCount; c++) {
      for (var r = 0; r < brickRowCount; r++) {
        var b = bricks[c][r];
        if (b.status === 1) {
          if (x + ballRadius > b.x && x - ballRadius < b.x + brickWidth &&
              y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {
            dy = -dy;
            b.status = 0;
            bricksRemaining--;
            score += 10;
            updateHud();

            if (bricksRemaining === 0) {
              handleLevelWon();
              return;
            }
          }
        }
      }
    }
  }

  function handleLevelWon() {
    state = STATE.WON;
    winScoreEl.textContent = "Score: " + score;
    hideAllOverlays();
    overlayWin.classList.remove("hidden");
    setButtonsForState();
  }

  function handleGameOver() {
    state = STATE.GAME_OVER;
    gameOverScoreEl.textContent = "You scored " + score;
    hideAllOverlays();
    overlayGameOver.classList.remove("hidden");
    setButtonsForState();
  }

  // ---------- Main loop ----------
  function draw() {
    if (state !== STATE.RUNNING) return;

    clear();
    drawBricks();
    drawPaddle();
    drawBall();
    collisionDetection();

    if (state !== STATE.RUNNING) {
      requestAnimationFrame(draw);
      return;
    }

    // Wall collisions (left/right)
    if (x + dx > LOGICAL_WIDTH - ballRadius || x + dx < ballRadius) {
      dx = -dx;
    }
    // Ceiling
    if (y + dy < ballRadius) {
      dy = -dy;
    } else if (y + dy > LOGICAL_HEIGHT - ballRadius - paddleHeight - 6) {
      // Near paddle height band
      if (x > paddleX && x < paddleX + paddleWidth) {
        // Reflect based on where it hit the paddle for a bit of control
        var hitPos = (x - paddleX) / paddleWidth; // 0..1
        var angle = (hitPos - 0.5) * 1.4; // -0.7..0.7 radians influence
        var speed = Math.sqrt(dx * dx + dy * dy);
        dx = speed * Math.sin(angle);
        dy = -Math.abs(speed * Math.cos(angle));
        if (Math.abs(dy) < 2) dy = dy < 0 ? -2 : 2;
      } else if (y + dy > LOGICAL_HEIGHT - ballRadius) {
        loseLife();
        requestAnimationFrame(draw);
        return;
      }
    }

    x += dx;
    y += dy;

    if (rightPressed) {
      paddleX += 6.5;
      if (paddleX + paddleWidth > LOGICAL_WIDTH) paddleX = LOGICAL_WIDTH - paddleWidth;
    } else if (leftPressed) {
      paddleX -= 6.5;
      if (paddleX < 0) paddleX = 0;
    }

    requestAnimationFrame(draw);
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives <= 0) {
      handleGameOver();
    } else {
      resetBallAndPaddle();
    }
  }

  // ---------- Game control ----------
  function newGame() {
    score = 0;
    lives = 3;
    level = 1;
    buildBricks();
    resetBallAndPaddle();
    updateHud();
  }

  function startGame() {
    if (state === STATE.IDLE || state === STATE.GAME_OVER) {
      newGame();
    }
    state = STATE.RUNNING;
    hideAllOverlays();
    setButtonsForState();
    requestAnimationFrame(draw);
  }

  function togglePause() {
    if (state === STATE.RUNNING) {
      state = STATE.PAUSED;
      hideAllOverlays();
      overlayPause.classList.remove("hidden");
      setButtonsForState();
    } else if (state === STATE.PAUSED) {
      state = STATE.RUNNING;
      hideAllOverlays();
      setButtonsForState();
      requestAnimationFrame(draw);
    }
  }

  function restartGame() {
    newGame();
    state = STATE.RUNNING;
    hideAllOverlays();
    setButtonsForState();
    requestAnimationFrame(draw);
  }

  function nextLevel() {
    level++;
    buildBricks();
    resetBallAndPaddle();
    updateHud();
    state = STATE.RUNNING;
    hideAllOverlays();
    setButtonsForState();
    requestAnimationFrame(draw);
  }

  // ---------- Input ----------
  document.addEventListener("keydown", function (e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (state === STATE.RUNNING || state === STATE.PAUSED) togglePause();
    }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  });

  function pointerToPaddle(clientX) {
    var rect = canvas.getBoundingClientRect();
    var scale = LOGICAL_WIDTH / rect.width;
    var relativeX = (clientX - rect.left) * scale;
    if (relativeX > 0 && relativeX < LOGICAL_WIDTH) {
      paddleX = relativeX - paddleWidth / 2;
      if (paddleX < 0) paddleX = 0;
      if (paddleX + paddleWidth > LOGICAL_WIDTH) paddleX = LOGICAL_WIDTH - paddleWidth;
    }
  }

  canvas.addEventListener("mousemove", function (e) {
    if (state === STATE.RUNNING) pointerToPaddle(e.clientX);
  });

  canvas.addEventListener("touchmove", function (e) {
    if (state === STATE.RUNNING && e.touches.length > 0) {
      pointerToPaddle(e.touches[0].clientX);
      e.preventDefault();
    }
  }, { passive: false });

  // ---------- Button wiring ----------
  btnStart.addEventListener("click", startGame);
  btnPause.addEventListener("click", togglePause);
  btnRestart.addEventListener("click", restartGame);

  btnOverlayStart.addEventListener("click", startGame);
  btnOverlayResume.addEventListener("click", togglePause);
  btnOverlayRestartFromLoss.addEventListener("click", restartGame);
  btnOverlayNext.addEventListener("click", nextLevel);

  // ---------- Initial paint ----------
  buildBricks();
  resetBallAndPaddle();
  updateHud();
  clear();
  drawBricks();
  drawPaddle();
  drawBall();
  setButtonsForState();

})();
