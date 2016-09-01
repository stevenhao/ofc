'use strict';

var Game = {
  rowSizes: [3, 5, 5],
  viewmodel: function(args) {
    this.init = function() {
      this.board = args.board || [[], [], []];
      this.oncommit = args.oncommit || function() {};
      this.pull = args.pull || [];
      this.pull.sort(p.byRank);
      this.sortBy = 'byRank';
      this.need = args.need || this.pull.length - (this.pull.length == 5 ? 0 : 1);
      this.pending = args.pending || [[], [], []];
      this.used = args.used || [];
      this.idx = 2; this.moveIdx(0, -1);
      this.brain = args.brain;
    }

    this.done = function() { return this.used.length == this.need; };

    this.use = function(card) {
      this.pending[this.idx].push(card);
      this.used.push(card);
      this.moveIdx(0, -1);
    };

    this.unuse = function(card) {
      this.pending.forEach(function(row) {
        row.remove(card);
      });
      this.used.remove(card);
    };

    this.help = function() {
      if (!this.brain) return;
      this.used.slice().forEach(this.unuse.bind(this));
      var moves = this.brain(this.board, this.pull);
      moves.forEach(function(move) {
        this.idx = move.idx;
        this.use(move.card);
      }.bind(this));
    };
    this.setIdx = function(idx) {
      this.idx = idx;
    };

    this.moveIdx = function(dir1, dir2) {
      var j = (this.idx + dir1 + 3) % 3;
      for(var i = 0; i < 2; i += 1) {
        if (this.pending[j].length + this.board[j].length < Game.rowSizes[j]) break;
        j = (j + dir2 + 3) % 3;
      }
      this.idx = j;
    };

    this.sort = function() {
      this.sortBy = this.sortBy == 'byRank' ? 'bySuit' : 'byRank';
      this.pull.sort(p[this.sortBy]);
    };

    this.commit = function() {
      for (var r = 0; r < 3; r += 1) {
        this.board[r] = this.board[r].concat(this.pending[r]);
        this.pending[r] = [];
      }
      this.oncommit(this.board);
    };

    this.init();
  },

  controller: function(args) {
    this.vm = m.prop(new Game.viewmodel(args));
  },

  view: function(ctrl, args) {
    var vm = ctrl.vm();
    return m('.game', [

      m('.board', vm.board.map(function(row, i) {
        return m('.row', function() {
          var next = vm.idx == i && !vm.done();
          var z = 8, p = 8;
          var children = [];
          children = children.concat(row.map(function(card) {
            return m('.slot',
                {style: {'z-index': z--}}, d.draw(card));
          }));
          children = children.concat(vm.pending[i].map(function(card) {
            return m('.slot.pending.clicky', {
              style: {'z-index': (p++) + (z--)},
              onclick: vm.unuse.bind(vm, card),
            }, d.draw(card));
          }));
          children = children.concat(range((i==0 ? 3 : 5) - children.length).map(function() {
            return m('.slot.clicky', {
              style: {'z-index': z--}, onclick: vm.setIdx.bind(vm, i) ,
            }, d.drawBlank(i == vm.idx));
          }));
          return children;
        }());
      })),

      m('.pull', (function(cards) {
        var r = 1; // split lots of cards into smaller rows
        while (cards.length / r > r * 2 + 5) r += 1; // at most 1x7, 2x9, 3x11, etc
        var idx = 0;
        return range(r).map(function(i) {
          var len = Math.floor((cards.length - idx) / (r - i));
          idx += len;
          return cards.slice(idx - len, idx);
        }).map(function(row) {
          return m('.row', row.map(function(card, i) {
            if (vm.used.contains(card)) {
              return m('.slot', {
                //onclick: vm.unuse.bind(vm, card),
              });
            } else {
              return m('.slot.clicky', {
                onclick: vm.use.bind(vm, card),
                config: function(el, init) {
                  el.addEventListener('touchstart', function() {
                    console.log('touchstart');
                  });
                  el.addEventListener('touchmove', function(evt) {
                    console.log('touchmove');
                    evt.preventDefault();
                  });
                },
              }, d.draw(card));
            }
          }));
        });
      })(vm.pull)),

      m('.buttons', function() {
        return [
          m('.btn.round.sort', { onclick: vm.sort.bind(vm) }, 'SORT'),
          vm.done() ? m('.btn.round.commit', { onclick: vm.commit.bind(vm) }, 'SET') : null,
          vm.brain ? m('.btn.wide.help', { onclick: vm.help.bind(vm) }, 'Ask God') : null,
        ];
      }()),
    ])
  },
};

var EndGame = {
  view: function(ctrl, args) {
    var board = args.board;
    var wasFL = args.wasFL;
    var hands = board.map(p.getPokerHand);
    var bonuses = hands.map(function(hand, i) {
      return p.getBonus(hand, i, wasFL);
    });
    var foul = p.betterPokerHand(hands[0], hands[1]) || p.betterPokerHand(hands[1], hands[2]);
    return m('.game', m('.board', board.map(function(row, i) {
      var bonus = bonuses[i];
      var bstr = bonus.name + '!&nbsp;&nbsp;+' + bonus.royalty;
      return m('.row', [
        m('.cards', row.map(function(card) {
          return m('.slot', foul ? d.drawFoul(card) : d.draw(card));
        })),
        (!foul && bonus.royalty) ? m('.bonus', {className: bonus.fl ? 'fl' : ''}, m.trust(bstr))
                      : null,
      ]);
    })));
  },
};

var FantasyLand = {
  controller: function(args) {
    this.cards = m.prop(args.cards || p.getDeck().slice(0, args.len || 14));
    this.endgame = m.prop(null);
    //this.endgame({ board: [ ['As', 'Ah', 'Qs'], ['Jh', 'Js', 'Jd', 'Jc', 'Tc'], ['3d', '4d', '5d', '6d', '7h'], ], });
  },
  view: function(ctrl, args) {
    return m('div', [
      (function() {
        if (ctrl.endgame()) {
          return m.component(EndGame, {
            board: ctrl.endgame().board,
            wasFL: true,
          });
        } else {
          return m('div', [
            m.component(Game, {
              pull: ctrl.cards(),
              discard: ctrl.cards().length - 13,
              oncommit: function(board) {
                ctrl.endgame({ board: board, });
              },
              brain: args.brain,
            }),
          ]);
        }
      })(),
    ]);
  },
};

var App = {
  controller: function() {
    this.cards = m.prop(p.getDeck().slice(0, 14).sort(p.byRank));
    this.inp = m.prop(p.toHandstr(this.cards()));
    this.a = 1;
    this.b = 0;
    this.refresh = function() {
      console.log('refreshing.\n');
      this.cards(p.parseHandstr(this.inp()));
      console.log(this.cards());
      this.b = this.a + 1;
      setTimeout(m.redraw.bind(m, true), 20);
    };
  },
  view: function(ctrl) {
    console.log('rendering.\n');
    ctrl.a += 1;
    return m('div', [
      ctrl.a > ctrl.b ? m.component(FantasyLand, {
        len: 14,
        brain: function(board, pull) {
          // we know this is a fantasy land hand
          var trace = b.getBestPlay(pull).play;
          var moves = [];
          [trace._top, trace.mid, trace.bot].forEach(function(row, i) {
            row.forEach(function(card) {
              moves.push({card: card, idx: i});
            });
          });
          return moves;
        },
        cards: ctrl.cards(),
      }) : null, // this is stupid. what's the right way to do it?
      m('textarea.edit', {
        value: ctrl.inp(),
        oninput: m.withAttr('value', ctrl.inp),
        onkeydown: function(ev) {
          if (ev.keyCode == 13) {
            ev.preventDefault();
            ctrl.refresh();
          }
        }
      }),
      m('button.edit', { onclick: ctrl.refresh.bind(ctrl) }),
    ]);
  },
};

m.mount(document.getElementById('root'), App);

window.setCards = function(s) {
  ctrl.setCards(s.split(' '));
  m.redraw(true);
}
