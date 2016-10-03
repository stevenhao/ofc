var U = require('../share/utils');
var Card = require('./card');
var Client = require('./client');
var Analysis = {
  controller: function(args) {
    args = args || {};
    var query = args.query || {
      board: [[], [], []],
      pull: ['As', 'Ah', 'Ks', 'Kh', '5s'],
    };
    console.log('ctrl:', this.query);
    var rows = [];
    var moves = null;
    var thinking = 0;
    this.think = function() {
      if (thinking) return;
      if (moves) {
        moves.forEach(function(move, i) {
          thinking++;
          Client.evaluate(query, move.play, function(data) {
            move.trials += data.trials;
            move.rph += data.rph;
            move.foul += data.foul;
            move.fl += data.fl;
            move.score += data.score;
            move.scoresq += data.scoresq;
            move.S = move.score / move.trials;
            move.SD = Math.sqrt(move.scoresq / move.trials - move.score * move.score);
            thinking--;
            if (!thinking) {
              m.redraw(true);
            }
          });
        });
      } else {
        thinking++;
        Client.getMoves(query, (function(data) {
          moves = data.map(function(move) {
            return {
              play: move.play,
              trials: 0,
              rph: 0,
              foul: 0,
              fl: 0,
              score: 0,
              scoresq: 0,
            };
          });
          thinking--;
          this.think();
        }).bind(this));
      }
    };
    this.think();
    //setInterval(this.think.bind(this), 5000);
    this.query = function() { return query; }
    this.rows = function() { return moves || []; }
  },

  view: function(ctrl) {
    function makePull(pull) {
      pull = U.clone(pull);
      var r = 1; while (pull.length / r > r * 2 + 5) r += 1;
      return m('.pull', U.range(r).map(function(i) {
        return pull.splice(0, Math.floor(pull.length / (r - i)));
      }).map(function(row) {
        return m('.row',
          {style: {'min-width': row.length*40+4 }},
          row.map(function(card, i) {
            return m('.slot.clicky', {
              //onclick: function() { args.onuse(card) },
            }, Card(card));
          }));
      }));
    }

    function makeBoard(board, args) {
      var rowSizes = [3, 5, 5];
      args = args || {};
      var pending = args.pending || [[], [], []];
      return m('.board', board.map(function(row, i) {
        return m('.row', [
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


    var rows = ctrl.rows(), query = ctrl.query();
    console.log('view', rows, query);
    return m('.anal', [
      m('.pane.left', [
        m('.vpane.upper', [
          makeBoard(query.board),
          makePull(query.pull),
        ]),
        m('hr'),
        m('.vpane.lower', [
          m('table', [
            m('thead', m('tr', [
                m('td', 'Score'),
                m('td', 'Move'),
                m('td', 'Royalty / FL / Foul'),
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
                  m('td', makeBoard(query.board, {pending: pending})),
                  m('td', makeStats(row.trials, row.rph, row.fl, row.foul)),
                  m('td', row.SD)
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
