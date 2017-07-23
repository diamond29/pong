import _ from 'lodash';
import 'pixi'
import 'p2'
import Phaser from 'phaser'

const getScreen = () => {
  const windowWidth = 640;
  const windowHeight = 480;
  return {
    width: windowWidth * .95,
    height: windowHeight * .95,
  }
};

const getGameProperties = (screen) => ({
  screenWidth: screen.width,
  screenHeight: screen.height,
  dashSize: 5,

  paddleLeftX: .08 * screen.width,
  paddleRightX: .92 * screen.width,
  paddleVelocity: 600,
  paddleSegmentsMax: 4,
  paddleSegmentHeight: 4,
  paddleSegmentAngle: 15,

  ballVelocity: 500,
  ballStartDelay: 2,
  ballRandomStartingAngleLeft: [-120, 120],
  ballRandomStartingAngleRight: [-60, 60],
  scoreToWin: 11,
});

const gameProperties = getGameProperties(getScreen());

var graphicAssets = {
  ballURL: 'assets/ball.png',
  ballName: 'ball',

  paddleURL: 'assets/paddle.png',
  paddleName: 'paddle'
};

const fontAssets = {
  scoreLeftX: gameProperties.screenWidth * 0.25,
  scoreRightX: gameProperties.screenWidth * 0.75,
  scoreTopY: gameProperties.screenWidth * 0.1,

  scoreFontStyle:{font: '80px Arial', fill: '#FFFFFF', align: 'center'},
}

var mainState = function(game) {
  this.backgroundGraphics;
  this.ballSprite;
  this.paddleLeftSprite;
  this.paddleRightSprite;
  this.paddleGroup;

  this.paddleLeftMoveUp;
  this.paddleLeftMoveDown;
  this.paddleRightMoveUp;
  this.paddleRightMoveDown;
  this.missedSide;

  this.scoreLeft;
  this.scoreRight;

  this.tf_scoreLeft;
  this.tf_scoreRight;
};

mainState.prototype = {
  preload: function () {
    game.load.image(graphicAssets.ballName, graphicAssets.ballURL);
    game.load.image(graphicAssets.paddleName, graphicAssets.paddleURL);
  },

  create: function () {
    this.initGraphics();
    this.initPhysics();
    this.initKeyboard();
    this.startDemo();
  },

  update: function () {
    this.moveLeftPaddle();
    this.moveRightPaddle();
    game.physics.arcade.overlap(this.ballSprite, this.paddleGroup, this.collideWithPaddle, null, this);
  },

  initGraphics: function () {
    this.backgroundGraphics = game.add.graphics(0, 0);
    this.backgroundGraphics.lineStyle(2, 0xFFFFFF, 1);

    for (var y = 0; y < gameProperties.screenHeight; y += gameProperties.dashSize * 2) {
      this.backgroundGraphics.moveTo(game.world.centerX, y);
      this.backgroundGraphics.lineTo(game.world.centerX, y + gameProperties.dashSize);
    }

    this.ballSprite = game.add.sprite(game.world.centerX, game.world.centerY, graphicAssets.ballName);
    this.ballSprite.anchor.set(0.5, 0.5);

    this.paddleLeftSprite = game.add.sprite(gameProperties.paddleLeftX, game.world.centerY, graphicAssets.paddleName);
    this.paddleLeftSprite.anchor.set(0.5, 0.5);

    this.paddleRightSprite = game.add.sprite(gameProperties.paddleRightX, game.world.centerY, graphicAssets.paddleName);
    this.paddleRightSprite.anchor.set(0.5, 0.5);

    this.tf_scoreLeft = game.add.text(fontAssets.scoreLeftX, fontAssets.scoreTopY, "0", fontAssets.scoreFontStyle);
    this.tf_scoreLeft.anchor.set(0.5, 0);

    this.tf_scoreRight = game.add.text(fontAssets.scoreRightX, fontAssets.scoreTopY, "0", fontAssets.scoreFontStyle);
    this.tf_scoreRight.anchor.set(0.5, 0);
  },
  initPhysics: function () {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.enable(this.ballSprite);

    this.ballSprite.checkWorldBounds = true;
    this.ballSprite.body.collideWorldBounds = true;
    this.ballSprite.body.immovable = true;
    this.ballSprite.body.bounce.set(1);
    this.ballSprite.events.onOutOfBounds.add(this.ballOutOfBounds, this);

    this.paddleGroup = game.add.group();
    this.paddleGroup.enableBody = true;
    this.paddleGroup.physicsBodyType = Phaser.Physics.ARCADE;

    this.paddleGroup.add(this.paddleLeftSprite);
    this.paddleGroup.add(this.paddleRightSprite);

    this.paddleGroup.setAll('checkWorldBounds', true);
    this.paddleGroup.setAll('body.collideWorldBounds', true);
    this.paddleGroup.setAll('body.immovable', true);

  },
  startDemo: function () {
    this.resetBall();
    this.enablePaddles(false);
    this.enableBoundaries(true);
    game.input.onDown.add(this.startGame, this);
  },
  startBall: function () {
    this.ballSprite.visible = true;

    var randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleRight.concat(gameProperties.ballRandomStartingAngleLeft));
    if (this.missedSide == 'right') {
      randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleRight);
    } else if (this.missedSide == 'left') {
      randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleLeft);
    }

    game.physics.arcade.velocityFromAngle(randomAngle, gameProperties.ballVelocity, this.ballSprite.body.velocity);
  },
  startGame: function () {
    game.input.onDown.remove(this.startGame, this);

    this.enablePaddles(true);
    this.enableBoundaries(false);
    this.resetBall();
    this.resetScores();
  },
  resetBall: function () {
    this.ballSprite.reset(game.world.centerX, game.rnd.between(0, gameProperties.screenHeight));
    this.ballSprite.visible = false;
    game.time.events.add(Phaser.Timer.SECOND * gameProperties.ballStartDelay, this.startBall, this);
  },
  enablePaddles: function (enabled) {
    this.paddleGroup.setAll('visible', enabled);
    this.paddleGroup.setAll('body.enable', enabled);

    this.paddleLeftSprite.visible = enabled;
    this.paddleRightSprite.visible = enabled;

    this.paddleLeftMoveUp.enabled = enabled;
    this.paddleLeftMoveDown.enabled = enabled;
    this.paddleRightMoveUp.enabled = enabled;
    this.paddleRightMoveDown.enabled = enabled;
  },
  initKeyboard: function () {
    this.paddleLeftMoveUp = game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.paddleLeftMoveDown = game.input.keyboard.addKey(Phaser.Keyboard.Z);

    this.paddleRightMoveUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    this.paddleRightMoveDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
  },
  moveLeftPaddle: function () {
    if (this.paddleLeftMoveUp.isDown)
    {
      this.paddleLeftSprite.body.velocity.y = -gameProperties.paddleVelocity;
    }
    else if (this.paddleLeftMoveDown.isDown)
    {
      this.paddleLeftSprite.body.velocity.y = gameProperties.paddleVelocity;
    } else {
      this.paddleLeftSprite.body.velocity.y = 0;
    }
  },
  moveRightPaddle: function () {
    if (this.paddleRightMoveUp.isDown)
    {
      this.paddleRightSprite.body.velocity.y = -gameProperties.paddleVelocity;
    }
    else if (this.paddleRightMoveDown.isDown)
    {
      this.paddleRightSprite.body.velocity.y = gameProperties.paddleVelocity;
    } else {
      this.paddleRightSprite.body.velocity.y = 0;
        }
  },
  collideWithPaddle: function (ball, paddle) {
    var returnAngle;
    var segmentHit = Math.floor((ball.y - paddle.y)/gameProperties.paddleSegmentHeight);

    if (segmentHit >= gameProperties.paddleSegmentsMax) {
      segmentHit = gameProperties.paddleSegmentsMax - 1;
    } else if (segmentHit <= -gameProperties.paddleSegmentsMax) {
      segmentHit = -(gameProperties.paddleSegmentsMax - 1);
    }

    if (paddle.x < gameProperties.screenWidth * 0.5) {
      returnAngle = segmentHit * gameProperties.paddleSegmentAngle;
      game.physics.arcade.velocityFromAngle(returnAngle, gameProperties.ballVelocity, this.ballSprite.body.velocity);
    } else {
      returnAngle = 180 - (segmentHit * gameProperties.paddleSegmentAngle);
      if (returnAngle > 180) {
        returnAngle -= 360;
      }

      game.physics.arcade.velocityFromAngle(returnAngle, gameProperties.ballVelocity, this.ballSprite.body.velocity);
    }
  },
  enableBoundaries: function (enabled) {
    game.physics.arcade.checkCollision.left = enabled;
    game.physics.arcade.checkCollision.right = enabled;
  },
  ballOutOfBounds: function() {
    if (this.ballSprite.x < 0) {
      this.missedSide = 'left';
      this.scoreRight++;
    } else if (this.ballSprite.x > gameProperties.screenWidth) {
      this.missedSide = 'right';
      this.scoreLeft++;
    }

    this.updateScoreTextFields();

    if (this.scoreLeft >= gameProperties.scoreToWin || this.scoreRight >= gameProperties.scoreToWin) {
      this.startDemo();
    } else {
      this.resetBall();
    }
  },
  updateScoreTextFields: function () {
    this.tf_scoreLeft.text = this.scoreLeft;
    this.tf_scoreRight.text = this.scoreRight;
  },
  resetScores: function () {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.updateScoreTextFields();
  },
};


var game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameContainer');
game.state.add('main', mainState);
game.state.start('main');

