var gridSpace = 30;

var fallingPiece;
var gridPieces = [];
var lineFades = [];
var gridWorkers = [];

var currentScore = 0;
var currentLevel = 1;
var linesCleared = 0;

var ticks = 0;
var updateEvery = 15;
var updateEveryCurrent = 15;
var fallSpeed = gridSpace * 0.5;
var pauseGame = false;
var gameOver = false;

var gameEdgeLeft = 150;
var gameEdgeRight = 450;

let gameHeight = 540;

let images = [];

let rotateBtn;
let fallBtn;
let leftBtn;
let rightBtn;

let music = new Audio("./audio/music.mp3");
let meow = new Audio("./audio/meow.wav");
let end = new Audio("./audio/end.mp3");
let playedEnd = false;

function preload() {
  rotateBtn = loadImage("./textures/rotate.png", 30, 30);
  fallBtn = loadImage("./textures/fall.png", 30, 30);
  leftBtn = loadImage("./textures/left.png", 30, 30);
  rightBtn = loadImage("./textures/right.png", 30, 30);
  for (let i = 0; i < 7; i++) {
    let curSet = [];
    for (let j = 0; j < 4; j++) {
      curSet.push(loadImage("./textures/" + i + "/" + j + ".png"));
    }
    images.push(curSet);
  }
}

function setup() {
  createCanvas(600, 700);
  angleMode(DEGREES);
  music.play();
  setInterval(() => {
    music.play();
  }, 85000);

  fallingPiece = new playPiece();
  fallingPiece.resetPiece();
  textFont("Trebuchet MS");
}

function draw() {
  var colorDark = "#071820",
    colorLight = "#344c57",
    colorBackground = "#d1d1d1";

  background(colorBackground);

  //Right side info
  fill(25);
  noStroke();
  rect(gameEdgeRight, 0, 150, gameHeight);
  //Left side info
  rect(0, 0, gameEdgeLeft, gameHeight);

  rect(0, 540, 600, 160);

  fill(colorBackground);
  //Score rectangle
  rect(450, 50, 150, 70);
  //Next piece rectangle
  rect(460, 300, 130, 130, 5, 5);
  //Level rectangle
  rect(460, 130, 130, 60, 5, 5);
  //Lines rectangle
  rect(460, 200, 130, 60, 5, 5);

  fill(colorLight);
  //Score lines
  rect(450, 55, 150, 20);
  rect(450, 80, 150, 4);
  rect(450, 110, 150, 4);

  fill(colorBackground);
  //Score banner
  rect(460, 30, 130, 35, 5, 5);

  strokeWeight(3);
  noFill();
  stroke(colorLight);
  //Score banner inner rectangle
  rect(465, 35, 120, 25, 5, 5);

  //Next piece inner rectangle
  stroke(colorLight);
  rect(465, 305, 120, 120, 5, 5);
  //Level inner rectangle
  rect(465, 135, 120, 50, 5, 5);
  //Lines inner rectangle
  rect(465, 205, 120, 50, 5, 5);

  //Draw the info labels
  fill(25);
  noStroke();
  textSize(24);
  textAlign(CENTER);
  text("Skóre", 525, 55);
  text("Úroveň", 525, 158);
  text("Řádky", 526, 228);

  //Draw the actual info
  textSize(24);
  textAlign(RIGHT);

  //The score
  text(currentScore, 560, 105);
  text(currentLevel, 560, 180);
  text(linesCleared, 560, 250);

  stroke(colorDark);
  line(gameEdgeRight, 0, gameEdgeRight, gameHeight);

  fallingPiece.show();

  if (
    keyIsDown(DOWN_ARROW) ||
    (mouseIsPressed && (mouseX - 300) ** 2 + (mouseY - 655) ** 2 < 900)
  ) {
    updateEvery = 2;
  } else {
    updateEvery = updateEveryCurrent;
  }

  if (!pauseGame) {
    ticks++;
    if (ticks >= updateEvery) {
      ticks = 0;
      fallingPiece.fall(fallSpeed);
    }
  }

  for (let i = 0; i < gridPieces.length; i++) {
    gridPieces[i].show();
  }

  for (let i = 0; i < lineFades.length; i++) {
    lineFades[i].show();
  }

  if (gridWorkers.length > 0) {
    gridWorkers[0].work();
  }

  image(rotateBtn, 300, 580, 70, 70);
  image(leftBtn, 220, 650, 70, 70);
  image(fallBtn, 300, 650, 70, 70);
  image(rightBtn, 380, 650, 70, 70);

  //Game over text
  if (gameOver) {
    if (!playedEnd) {
      end.play();
      playedEnd = true;
    }
    fill("#ffee6e");
    textSize(64);
    textAlign(CENTER);
    text("Fůů", 300, 270);
  }
}

function lineBar(y, index) {
  this.pos = new p5.Vector(gameEdgeLeft, y);
  this.width = gameEdgeRight - gameEdgeLeft;
  this.index = index;

  this.show = function () {
    fill(255);
    noStroke();
    rect(this.pos.x, this.pos.y, this.width, gridSpace);

    if (this.width + this.pos.x > this.pos.x) {
      this.width -= 10;
      this.pos.x += 5;
    } else {
      lineFades.splice(this.index, 1);
      //shiftGridDown(this.pos.y, gridSpace);
      gridWorkers.push(new worker(this.pos.y, gridSpace));
    }
  };
}

function keyPressed() {
  if (!pauseGame) {
    if (keyCode === LEFT_ARROW) {
      fallingPiece.input(LEFT_ARROW);
    } else if (keyCode === RIGHT_ARROW) {
      fallingPiece.input(RIGHT_ARROW);
    }
    if (keyCode === UP_ARROW) {
      fallingPiece.input(UP_ARROW);
    }
  }
}

function mouseClicked() {
  if (mouseY > 540) {
    if ((mouseX - 300) ** 2 + (mouseY - 580) ** 2 < 900) {
      fallingPiece.input(UP_ARROW);
    } else if ((mouseX - 220) ** 2 + (mouseY - 655) ** 2 < 900) {
      fallingPiece.input(LEFT_ARROW);
    } else if ((mouseX - 380) ** 2 + (mouseY - 655) ** 2 < 900) {
      fallingPiece.input(RIGHT_ARROW);
    }
  }
}

function playPiece() {
  this.pos = new p5.Vector(0, 0);
  this.rotation = 0;
  this.nextPieceType = Math.floor(Math.random() * 7);
  this.nextPieces = [];
  this.pieceType = 0;
  this.pieces = [];
  this.orientation = [];
  this.fallen = false;

  this.nextPiece = function () {
    this.nextPieceType = pseudoRandom(this.pieceType);
    this.nextPieces = [];

    var points = orientPoints(this.nextPieceType, 0);
    var xx = 525,
      yy = 365;

    if (this.nextPieceType != 0 && this.nextPieceType != 3) {
      xx += gridSpace * 0.5;
    }

    this.nextPieces.push(
      new tile(
        xx + points[0][0] * gridSpace,
        yy + points[0][1] * gridSpace,
        this.nextPieceType,
        0
      )
    );
    this.nextPieces.push(
      new tile(
        xx + points[1][0] * gridSpace,
        yy + points[1][1] * gridSpace,
        this.nextPieceType,
        1
      )
    );
    this.nextPieces.push(
      new tile(
        xx + points[2][0] * gridSpace,
        yy + points[2][1] * gridSpace,
        this.nextPieceType,
        2
      )
    );
    this.nextPieces.push(
      new tile(
        xx + points[3][0] * gridSpace,
        yy + points[3][1] * gridSpace,
        this.nextPieceType,
        3
      )
    );
  };
  this.fall = function (amount) {
    if (!this.futureCollision(0, amount, this.rotation)) {
      this.addPos(0, amount);
      this.fallen = true;
    } else {
      //WE HIT SOMETHING D:
      if (!this.fallen) {
        //Game over aka pause forever
        pauseGame = true;
        gameOver = true;
      } else {
        this.commitShape();
      }
    }
  };
  this.resetPiece = function () {
    this.rotation = 0;
    this.fallen = false;
    this.pos.x = 330;
    this.pos.y = -60;

    this.pieceType = this.nextPieceType;

    this.nextPiece();
    this.newPoints();
  };
  this.newPoints = function () {
    var points = orientPoints(this.pieceType, this.rotation);
    this.orientation = points;
    this.pieces = [];
    this.pieces.push(
      new tile(
        this.pos.x + points[0][0] * gridSpace,
        this.pos.y + points[0][1] * gridSpace,
        this.pieceType,
        0
      )
    );
    this.pieces.push(
      new tile(
        this.pos.x + points[1][0] * gridSpace,
        this.pos.y + points[1][1] * gridSpace,
        this.pieceType,
        1
      )
    );
    this.pieces.push(
      new tile(
        this.pos.x + points[2][0] * gridSpace,
        this.pos.y + points[2][1] * gridSpace,
        this.pieceType,
        2
      )
    );
    this.pieces.push(
      new tile(
        this.pos.x + points[3][0] * gridSpace,
        this.pos.y + points[3][1] * gridSpace,
        this.pieceType,
        3
      )
    );
  };
  //Whenever the piece gets rotated, this gets the new positions of the squares
  this.updatePoints = function () {
    if (this.pieces) {
      var points = orientPoints(this.pieceType, this.rotation);
      this.orientation = points;
      for (var i = 0; i < 4; i++) {
        this.pieces[i].rotation = this.rotation;
        this.pieces[i].pos.x = this.pos.x + points[i][0] * gridSpace;
        this.pieces[i].pos.y = this.pos.y + points[i][1] * gridSpace;
      }
    }
  };
  //Adds to the position of the piece and it's square objects
  this.addPos = function (x, y) {
    this.pos.x += x;
    this.pos.y += y;

    if (this.pieces) {
      for (var i = 0; i < 4; i++) {
        this.pieces[i].pos.x += x;
        this.pieces[i].pos.y += y;
      }
    }
  };
  //Checks for collisions after adding the x and y to the current positions and also applying the given rotation
  this.futureCollision = function (x, y, rotation) {
    var xx,
      yy,
      points = 0;
    if (rotation != this.rotation) {
      //Gets a new point orientation to check against
      points = orientPoints(this.pieceType, rotation);
    }

    for (var i = 0; i < this.pieces.length; i++) {
      if (points) {
        xx = this.pos.x + points[i][0] * gridSpace;
        yy = this.pos.y + points[i][1] * gridSpace;
      } else {
        xx = this.pieces[i].pos.x + x;
        yy = this.pieces[i].pos.y + y;
      }
      //Check against walls and bottom
      if (
        xx < gameEdgeLeft ||
        xx + gridSpace > gameEdgeRight ||
        yy + gridSpace > gameHeight
      ) {
        return true;
      }
      //Check against all pieces in the main gridPieces array (stationary pieces)
      for (var j = 0; j < gridPieces.length; j++) {
        if (xx === gridPieces[j].pos.x) {
          if (
            yy >= gridPieces[j].pos.y &&
            yy < gridPieces[j].pos.y + gridSpace
          ) {
            return true;
          }
          if (
            yy + gridSpace > gridPieces[j].pos.y &&
            yy + gridSpace <= gridPieces[j].pos.y + gridSpace
          ) {
            return true;
          }
        }
      }
    }
  };
  //Handles input ;)
  this.input = function (key) {
    switch (key) {
      case LEFT_ARROW:
        if (!this.futureCollision(-gridSpace, 0, this.rotation)) {
          this.addPos(-gridSpace, 0);
        }
        break;
      case RIGHT_ARROW:
        if (!this.futureCollision(gridSpace, 0, this.rotation)) {
          this.addPos(gridSpace, 0);
        }
        break;
      case UP_ARROW:
        var rotation = this.rotation + 1;
        if (rotation > 3) {
          rotation = 0;
        }
        if (!this.futureCollision(gridSpace, 0, rotation)) {
          this.rotate();
        }
        break;
    }
  };
  //Rotates the piece by one
  this.rotate = function () {
    this.rotation += 1;
    if (this.rotation > 3) {
      this.rotation = 0;
    }
    this.updatePoints();
  };
  //Displays the piece's square objects
  this.show = function () {
    for (var i = 0; i < this.pieces.length; i++) {
      this.pieces[i].show();
    }
    for (var i = 0; i < this.nextPieces.length; i++) {
      this.nextPieces[i].show();
    }
  };
  //Add the pieces to the gridPieces
  this.commitShape = function () {
    for (var i = 0; i < this.pieces.length; i++) {
      gridPieces.push(this.pieces[i]);
    }
    this.resetPiece();
    analyzeGrid();
  };
}

function tile(x, y, type, index, rotation = 0) {
  this.pos = new p5.Vector(x, y);
  this.type = type;
  this.index = index;
  this.rotation = rotation;

  this.show = function () {
    let trueIndex = newIndex(this.type, this.rotation, this.index);
    imageMode(CENTER);
    push();
    translate(this.pos.x + gridSpace / 2, this.pos.y + gridSpace / 2); //put your location inhere
    rotate(90 * this.rotation);
    image(images[this.type][trueIndex], 0, 0, gridSpace, gridSpace); //put 0,0 and then your image size
    pop();
  };
}

function newIndex(type, rotation, index) {
  if (type == 0 && rotation > 1) {
    return 3 - index;
  }
  if (type == 1) {
    if (rotation == 1) return (index + 1) % 4;
    if (rotation > 1) return 3 - index;
  }
  if (type == 2) {
    if (rotation == 2) {
      if (index > 1) return 3 - index;
      return 2 + index;
    }
    if (rotation == 3) return 3 - index;
  }
  if (type == 3) {
    if (rotation == 1) {
      switch (index) {
        case 0:
          return 2;
        case 1:
          return 0;
        case 2:
          return 3;
        case 3:
          return 1;
      }
    }
    if (rotation == 2) return 3 - index;
    if (rotation == 3) return newIndex(3, 1, 3 - index);
  }
  if (type == 4) {
    if (rotation == 1 && index != 3) return (index + 1) % 3;
    if (rotation == 2) {
      if (index > 1) return index - 2;
      return index + 2;
    }
    if (rotation == 3) return newIndex(4, 1, 3 - index);
  }
  if (type == 5) {
    if (rotation == 1 && index > 1) return 5 - index;
    if (rotation == 2) {
      if (index == 1 || index == 2) return 2 - index;
      return (3 + index) % 4;
    }
    if (rotation == 3) {
      if (index > 1) return 3 - index;
      return index + 2;
    }
  }
  if (type == 6) {
    if (rotation == 1) {
      if (index > 1) return 3 - index;
      return index + 2;
    }
    if (rotation == 2) return 3 - index;
    if (rotation == 3 && index < 2) return 1 - index;
  }
  return index;
}

//Basically random with a bias against the same piece twice
function pseudoRandom(previous) {
  var roll = Math.floor(Math.random() * 8);
  if (roll === previous || roll === 7) {
    roll = Math.floor(Math.random() * 7);
  }
  return roll;
}

//Checks until it can no longer find any horizontal staights
function analyzeGrid() {
  var score = 0;
  while (checkLines()) {
    score += 100;
    linesCleared += 1;
    if (linesCleared % 10 === 0) {
      currentLevel += 1;
      //Increase speed here
      if (updateEveryCurrent > 4) {
        updateEveryCurrent -= 1;
      }
    }
  }
  if (score > 100) {
    score *= 2;
  }
  currentScore += score;
}

function checkLines() {
  var count = 0;
  var runningY = -1;
  var runningIndex = -1;

  gridPieces.sort(function (a, b) {
    return a.pos.y - b.pos.y;
  });

  for (var i = 0; i < gridPieces.length; i++) {
    if (gridPieces[i].pos.y === runningY) {
      count++;
      if (count === 10) {
        meow.play();
        //YEEHAW
        gridPieces.splice(runningIndex, 10);

        lineFades.push(new lineBar(runningY));
        return true;
      }
    } else {
      runningY = gridPieces[i].pos.y;
      count = 1;
      runningIndex = i;
    }
  }
  return false;
}

function worker(y, amount) {
  this.amountActual = 0;
  this.amountTotal = amount;
  this.yVal = y;

  this.work = function () {
    if (this.amountActual < this.amountTotal) {
      for (var j = 0; j < gridPieces.length; j++) {
        if (gridPieces[j].pos.y < y) {
          gridPieces[j].pos.y += 5;
        }
      }
      this.amountActual += 5;
    } else {
      gridWorkers.shift();
    }
  };
}

//Sorts out the block positions for a given type and rotation
function orientPoints(pieceType, rotation) {
  var results = [];
  switch (pieceType) {
    case 0:
      switch (rotation) {
        case 0:
          results = [
            [-2, 0],
            [-1, 0],
            [0, 0],
            [1, 0],
          ];
          break;
        case 1:
          results = [
            [0, -1],
            [0, 0],
            [0, 1],
            [0, 2],
          ];
          break;
        case 2:
          results = [
            [-2, 1],
            [-1, 1],
            [0, 1],
            [1, 1],
          ];
          break;
        case 3:
          results = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [-1, 2],
          ];
          break;
      }
      break;
    case 1:
      switch (rotation) {
        case 0:
          results = [
            [-2, -1],
            [-2, 0],
            [-1, 0],
            [0, 0],
          ];
          break;
        case 1:
          results = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
          ];
          break;
        case 2:
          results = [
            [-2, 0],
            [-1, 0],
            [0, 0],
            [0, 1],
          ];
          break;
        case 3:
          results = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [-2, 1],
          ];
          break;
      }
      break;
    case 2:
      switch (rotation) {
        case 0:
          results = [
            [-2, 0],
            [-1, 0],
            [0, 0],
            [0, -1],
          ];
          break;
        case 1:
          results = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
          ];
          break;
        case 2:
          results = [
            [-2, 0],
            [-2, 1],
            [-1, 0],
            [0, 0],
          ];
          break;
        case 3:
          results = [
            [-2, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
          ];
          break;
      }
      break;
    case 3:
      results = [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [0, 0],
      ];
      break;
    case 4:
      switch (rotation) {
        case 0:
          results = [
            [-1, -1],
            [-2, 0],
            [-1, 0],
            [0, -1],
          ];
          break;
        case 1:
          results = [
            [-1, -1],
            [-1, 0],
            [0, 0],
            [0, 1],
          ];
          break;
        case 2:
          results = [
            [-1, 0],
            [-2, 1],
            [-1, 1],
            [0, 0],
          ];
          break;
        case 3:
          results = [
            [-2, -1],
            [-2, 0],
            [-1, 0],
            [-1, 1],
          ];
          break;
      }
      break;
    case 5:
      switch (rotation) {
        case 0:
          results = [
            [-2, 0],
            [-1, 0],
            [-1, -1],
            [0, 0],
          ];
          break;
        case 1:
          results = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 0],
          ];
          break;
        case 2:
          results = [
            [-2, 0],
            [-1, 0],
            [0, 0],
            [-1, 1],
          ];
          break;
        case 3:
          results = [
            [-2, 0],
            [-1, -1],
            [-1, 0],
            [-1, 1],
          ];
          break;
      }
      break;
    case 6:
      switch (rotation) {
        case 0:
          results = [
            [-2, -1],
            [-1, -1],
            [-1, 0],
            [0, 0],
          ];
          break;
        case 1:
          results = [
            [-1, 0],
            [-1, 1],
            [0, 0],
            [0, -1],
          ];
          break;
        case 2:
          results = [
            [-2, 0],
            [-1, 0],
            [-1, 1],
            [0, 1],
          ];
          break;
        case 3:
          results = [
            [-2, 0],
            [-2, 1],
            [-1, 0],
            [-1, -1],
          ];
          break;
      }
      break;
  }
  return results;
}
