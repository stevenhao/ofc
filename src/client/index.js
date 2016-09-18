'use strict';

var U = require('../share/utils');
var range = U.range;
var c = U.c;

var Poker = require('../share/poker');
var Round = require('../share/round');
var Pineapple = require('../share/pineapple');
var Brain = require('./brain');
var Game = require('./game');

function stupidBrain(ppp) {
  var board = ppp.board;
  var pull = ppp.pull;
  var toDiscard = ppp.toDiscard;
  var idx = 0;
  var play = [[], [], []];
  range(pull.length - toDiscard).forEach(function(i) {
    while (idx < 3 && board[idx].length + play[idx].length >= Game.rowSizes[idx]) {
      idx += 1;
    }
    play[idx].push(pull[i]);
  });
  return play;
}

var App = {
  ai: function() {
    this.brain = stupidBrain;
    this.go = function(perspective, args) {
      if (!perspective.pull) {
        args.onpull();
      } else {
        var pending = this.brain(perspective);
        args.oncommit(pending);
      }
    };
  },

  controller: function() {
    var aispeed = 5;
    this.ai = new App.ai();
    this.kill = false;
    this.round = new Round(['Me', 'Bot']),

    this.aimove = function(side) {
      side = side || 'Bot';
      var perspective = this.round.getPerspective(side)
      console.log('aimove', perspective);
      this.ai.go(perspective, { oncommit: this.oncommit.bind(this), onpull: this.onpull.bind(this) });
    };
    window.go = this.aimove.bind(this, 'Me');

    this.oncommit = function(pending) {
      console.log('round: ', JSON.stringify(this.round));
      console.log('applying', pending);
      this.round.apply(this.round.players[this.round.turn], pending);
      console.log('round: ', JSON.stringify(this.round));
      this.kill = true;
      m.redraw(true);
      m.redraw(true);
      if (this.round.turn == 1) {
        setTimeout(this.aimove.bind(this), aispeed);
      }
    };

    this.onpull = function() {
      this.round.getPull();
      this.kill = true;
      m.redraw(true);
      m.redraw(true);
      if (this.round.turn == 1) {
        setTimeout(this.aimove.bind(this), aispeed);
      }
    };
  },

  view: function(ctrl) {
    if (ctrl.kill) {
      ctrl.kill = false;
      return m('div', 'redrawing'); // next cycle will recreate components
    }
    var perspective = ctrl.round.getPerspective('Me');
    return m('div', [
      m('header', [
        m('div', 'Stevie'),
      ]),
      m('div', m.component(Game, {
        perspective: perspective,
        oncommit: ctrl.oncommit.bind(ctrl),
        onpull: ctrl.onpull.bind(ctrl),
        brain: stupidBrain,
      }))
    ]);
  },
};

m.route.mode = "hash";
m.route(document.body, "/", {
    "/play": App,
    "/": App,
});
