import _ from 'lodash';
import phaser from 'phaser';

const gameProperties = {
  screenWidth: 640,
  screenHeight: 480,
};

var mainState = function(game){};

mainState.prototype = {
  preload: function () {

  },

  create: function () {

  },

  update: function () {

  },
};

var game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameDiv');
game.state.add('main', mainState);
game.state.start('main');
