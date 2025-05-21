import "./style.css";
import Phaser from "phaser";

let gameWidth = 800;
let gameHeight = 600;
let xCenter = gameWidth / 2;
let yCenter = gameHeight / 2;

let pad = null;

const config = {
  type: Phaser.WEBGL,
  width: gameWidth,
  height: gameHeight,
  input: {
    gamepad: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  backgroundColor: "#1d1d1d",
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let player, platforms, stars, bombs;
let cursors;
let score = 0;
let scoreText;
let gameOver = false;

function preload() {
  this.load.image("sky", "/images/sky.png");
  this.load.image("ground", "/images/platform.png");
  this.load.image("star", "/images/star.png");
  this.load.image("bomb", "/images/bomb.png");
  this.load.spritesheet("dude", "/images/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

function create() {
  this.add.image(xCenter, yCenter, "sky");

  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, "ground").setScale(2).refreshBody();
  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");

  player = this.physics.add.sprite(100, 450, "dude");
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  this.physics.add.collider(player, platforms);

  cursors = this.input.keyboard.createCursorKeys();

  stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.25, 0.3));
  });

  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);

  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  bombs = this.physics.add.group();
  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // Gamepad setup
  this.input.gamepad.once("connected", function (connectedPad) {
    pad = connectedPad;
    console.log("Gamepad connected:", pad.id);
  });

  function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText(`Score: ${score}`);

    if (stars.countActive(true) === 0) {
      stars.children.iterate((child) => {
        child.enableBody(true, child.x, 0, true, true);
      });

      let x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);
      let bomb = bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }

  function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameOver = true;
  }
}

function update() {
  if (gameOver) return;

  let velocityX = 0;
  let jump = false;

  // Keyboard controls
  if (cursors.left.isDown) {
    velocityX = -160;
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    velocityX = 160;
    player.anims.play("right", true);
  }

  if (cursors.up.isDown && player.body.touching.down) {
    jump = true;
  }

  // Gamepad controls
  if (pad) {
    const axisH = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;

    if (axisH < -0.1) {
      velocityX = -160;
      player.anims.play("left", true);
    } else if (axisH > 0.1) {
      velocityX = 160;
      player.anims.play("right", true);
    }

    if (pad.buttons[0].pressed && player.body.touching.down) {
      jump = true;
    }
  }

  player.setVelocityX(velocityX);

  if (velocityX === 0 && player.body.touching.down) {
    player.anims.play("turn");
  }

  if (jump) {
    player.setVelocityY(-470);
  }
}
