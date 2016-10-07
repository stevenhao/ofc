var U = require('../share/utils');
var Card = require('./card');
var Client = require('./client');
var Editor = require('./editor');
var BoardEditor = Editor.BoardEditor;
var PullEditor = Editor.PullEditor;

var Move = function(play) {
  return {
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
      serverBusy = true;

      if (moves.length > 0) runTrials(function() { serverBusy = false; });
      else getMoves(function() { serverBusy = false; });
    };

    this.step = step;
    this.getMoves = function() { return moves };
    this.getQuery = function() { return query };
  },

  controller: function(args) {
    args = args || {};

    var board = m.prop([[], [], []]);
    var oboard = m.prop([[], [], []]);
    var discard = m.prop([]);
    var pull = m.prop(['As', 'Ks', 'Qs', 'Js', 'Ad']);
    var model = new Analysis.model(board(), oboard(), discard(), pull());

    var tinterval = -1;
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

    this.getMoves = model.getMoves;
    this.getQuery = model.getQuery;
    this.board = board;
    this.oboard = oboard;
    this.discard = discard;
    this.pull = pull;
    this.startThinking = startThinking;
    this.stopThinking = stopThinking;
  },

  view: function(ctrl) {
    function makeBoard(board, args) {
      var rowSizes = [3, 5, 5];
      args = args || {};
      var pending = args.pending || [[], [], []];
      return m('.board', board.map(function(row, i) {
        var top = 0;
        return m('.row', { style: { top: top + 'px' } }, [
          m('.cards', (function() {
            var A = row.map(function(card) {
              return m('.slot',
                  Card(card));
            });
            var B = pending[i].map(function(card) {
              return m('.slot',
                  Card(card));
            });
            var C = U.range(rowSizes[i] - A.length - B.length).map(function() {
              return m('.slot',
                  Card('', {blank: true}));
            });
            return A.concat(B).concat(C);
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
        m('.vpane.upper', [
          m.component(BoardEditor, {
            oninput: null,
          }),
          m.component(BoardEditor, {
            oninput: null,
          }),
          m.component(PullEditor, {
            cards: ctrl.pull(),
            oninput: ctrl.pull,
          }),
        ]),
        m('hr'),
        m('div', [
          m('button', {
            onclick: ctrl.startThinking,
          }, 'Start'),
          m('button', {
            onclick: ctrl.stopThinking,
          }, 'Stop'),
        ]),
        m('.vpane.lower', [
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
        ]),
      ]),
      m('.pane.right', [
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
