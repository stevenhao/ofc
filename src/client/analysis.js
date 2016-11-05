var U = require('../share/utils');
var Card = require('./card');
var Client = require('./client');
var Editor = require('./editor');
var BoardEditor = Editor.BoardEditor;
var PullEditor = Editor.PullEditor;

var Move = function(play) {
  return {
    S: 0,
    SD: 0,
    play: play,
    trials: 0,
    rph: 0,
    foul: 0,
    fl: 0,
    score: 0,
    scoresq: 0,
    update: function(trial) {
      this.trials += trial.trials;
      this.score += trial.score;
      this.scoresq += trial.scoresq;
      this.rph += trial.rph;
      this.foul += trial.foul;
      this.fl += trial.fl;
      this.S = this.score / this.trials;
      this.SD = Math.sqrt((this.scoresq / this.trials - this.S * this.S) / this.trials);
    },
  };
};

var Analysis = {
  model: function(board, oboard, discard, pull) {

    var query = { board: board, oboard: oboard, discard: discard, pull: pull };

    var moves = [];

    var getMoves = function(cbk) {
      console.log('get moves');
      Client.getMoves(query, function(data) {
        moves = data.map(function(move) {
          return Move(move.play);
        });
        cbk();
      });
    };

    var sortMoves = function() {
      moves.sort(function(a, b) {
        return b.score - a.score;
      });
    };

    var runTrials = function(cbk) {
      var seed = Math.floor(Math.random() * 10000);
      var waiting = 0;
      moves.forEach(function(move, i) {
        waiting++;
        Client.evaluate(query, move.play, seed, function(data) {
          move.update(data);
          if (--waiting == 0) { cbk(); }
        });
      });
    };

    var serverBusy = false;
    var step = function() {
      if (serverBusy) return;
      function start() {
        serverBusy = true;
        m.startComputation();
      }
      function end() {
        m.endComputation();
        serverBusy = false;
      }

      start();
      if (moves.length > 0) runTrials(end);
      else getMoves(end);
      sortMoves();
    };

    this.step = step;
    this.getMoves = function() { return moves };
    this.getQuery = function() { return query };
  },

  controller: function(args) {
    args = args || {};

    var board = m.prop([['', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]);
    var oboard = m.prop([['', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]);
    var discard = m.prop([]);
    var pull = m.prop(['As', 'Ks', 'Qs', 'Js', 'Ad']);
    var model = new Analysis.model(board(), oboard(), discard(), pull());

    var tinterval = -1;
    var reset = function() {
      model = new Analysis.model(board(), oboard(), discard(), pull());
      console.log('reset. moves:', model.getMoves());
    };

    var startThinking = function() {
      if (tinterval == -1) {
        model.step();
        tinterval = setInterval(model.step, 1000);
      }
    };

    var stopThinking = function() {
      clearInterval(tinterval);
      tinterval = -1;
    };

    var resetAndStart = function() {
      stopThinking();
      reset();
      startThinking();
    };

    var getMoves = function() {
      return model.getMoves();
    };

    var getQuery = function() {
      return model.getQuery();
    };

    this.getMoves = getMoves;
    this.getQuery = getQuery;
    this.board = board;
    this.oboard = oboard;
    this.discard = discard;
    this.pull = pull;
    this.reset = reset;
    this.resetAndStart = resetAndStart;
    this.startThinking = startThinking;
    this.stopThinking = stopThinking;
  },

  view: function(ctrl) {
    function makeBoard(board, args) {
      args = args || {};
      var pending = args.pending || [[], [], []];
      return m('.board', board.map(function(row, i) {
        var top = 0;
        return m('.row', { style: { top: top + 'px' } }, [
          m('.cards', (function() {
            var A = row.map(function(card) {
              if (card == '' && pending[i].length) card = pending[i].splice(0, 1)[0];
              return m('.slot',
                  Card(card));
            });
            return A;
          })()),
        ]);
      }));
    }

    function makeStats(trials, rph, fl, foul) {
      function pct(a, b) {
        return (100 * a / b).toFixed(1) + '%';
      }
      function flr(a, b) {
        return (a/b*1.).toFixed(1);
      }
      return m('span', [
        flr(rph, trials),
        pct(fl, trials),
        pct(foul, trials),
      ].join('/'));
    }

    function makeS(S) {
      return m('span', S.toFixed(2));
    }

    var rows = ctrl.getMoves();
    var query = ctrl.getQuery();
    console.log('view', rows, query);
    return m('.anal', [
      m('.pane.left', [
        m('.editors', [
          m.component(BoardEditor, {
            board: ctrl.oboard(),
            oninput: ctrl.oboard,
          }),
          m.component(BoardEditor, {
            board: ctrl.board(),
            oninput: ctrl.board,
          }),
          m.component(PullEditor, {
            pull: ctrl.pull(),
            oninput: ctrl.pull,
          }),
        ]),
        m('button.analyze-btn', {
          onclick: ctrl.resetAndStart,
        }, 'Analyze!'),
      ]),
      m('.pane.right', [
        m('.buttons', [
          m('button', {
            onclick: ctrl.startThinking,
          }, 'Start'),
          m('button', {
            onclick: ctrl.stopThinking,
          }, 'Stop'),
        ]),
        m('table', [
          m('thead', m('tr', [
              m('td', 'Score'),
              m('td', 'Move'),
              m('td', 'Royalty / FL / Foul'),
              m('td', 'SD(score)'),
          ])),
          m('tbody',
            rows.map(function(row) {
              console.log('row: ', row);
              var pending = [[], [], []];
              row.play.forEach(function(idx, i) {
                if (idx == -1) return;
                pending[idx].push(query.pull[i]);
              });
              return m('tr', [
                  m('td', makeS(row.S)),
                  m('td.board-wrapper', makeBoard(query.board, {pending: pending})),
                  m('td', makeStats(row.trials, row.rph, row.fl, row.foul)),
                  m('td', row.SD.toFixed(2))
              ]);
            })
          ),
        ]),
      // the selected guy, with details
      // include graph representation of the board
      // include "histogram" -- take top 3 most likely outcomes
      // e.g. 30% Foul, 30% Kings, 20% Full House
      // allow for more granularity  -- bucket on largest royalty by default
      ]),
    ]);
  },
};
module.exports = Analysis;
