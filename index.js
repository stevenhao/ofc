'use strict';

function stupidBrain(board, pull, toDiscard) {
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

var Game = {
  rowSizes: [3, 5, 5],
  viewmodel: function(args) {
    console.log(args);
    this.opp = args.opp || [];
    this.board = args.board || [[], [], []];
    this.oncommit = args.oncommit || function() {};
    this.discarded = args.discarded || [];
    this.pull = args.pull || [];
    this.pull.sort(p.byRank);
    this.sortBy = 'byRank';
    this.toDiscard = args.toDiscard || 0;
    this.pending = args.pending || [[], [], []];
    this.used = args.used || [];
    this.brain = args.brain;
    this.active = args.active || false;

    this.done = function() { return this.used.length + this.toDiscard == this.pull.length; };

    this.use = function(card) {
      this.pending[this.idx].push(card);
      this.used.push(card);
      this.moveIdx(0, -1);
    };

    this.unuse = function(card) {
      var idx = -1;
      this.pending.forEach(function(row, i) {
        if (row.indexOf(card) != -1) {
          row.remove(card);
          idx = i;
        }
      });
      this.used.remove(card);
      this.setIdx(idx);
    };

    this.help = function() {
      if (!this.brain) return;
      this.used.slice().forEach(this.unuse.bind(this));
      var play = this.brain(cp(this.board), cp(this.pull), this.toDiscard);
      play.forEach(function(row, i) {
        this.idx = i;
        row.forEach(function(card) {
          this.use(card);
        }.bind(this));
      }.bind(this));
    };

    this.setIdx = function(idx) { this.idx = idx; };

    this.moveIdx = function(dir1, dir2) {
      var j = (this.idx + dir1 + 3) % 3;
      for(var i = 0; i < 2; i += 1, j = (j + dir2 + 3) % 3) {
        if (this.pending[j].length + this.board[j].length < Game.rowSizes[j]) break;
      }
      this.idx = j;
    };

    this.sort = function() {
      this.sortBy = this.sortBy == 'byRank' ? 'bySuit' : 'byRank';
      this.pull.sort(p[this.sortBy]);
    };

    this.commit = function() { this.oncommit(this.pending); };

    this.idx = 2; this.moveIdx(0, -1);
  },

  controller: function(args) {
    this.vm = m.prop(new Game.viewmodel(args));
  },

  view: function(ctrl, args) {
    var vm = ctrl.vm();
    return m('.game', [
      m('.there',
        {className: !vm.active ? 'active' : 'inactive'},
        vm.opp.map(function(board, idx) {
          return m('.board', board.map(function(row, i) {
            return m('.row', function() {
              var next = vm.idx == i && !vm.done();
              var z = 8, p = 8;
              var children = [];
              children = children.concat(row.map(function(card) {
                return m('.slot', {style: {'z-index': z--}}, d.draw(card));
              }));
              children = children.concat(
                  range(Game.rowSizes[i] - children.length).map(function() {
                    return m('.slot', {
                      style: {'z-index': z--},
                    }, d.drawBlank(false, !vm.active));
                  }));
              return children;
            }());
          }));
      })),

      m('.here', {className: vm.active ? 'active' : 'inactive'}, [
        m('.board', vm.board.map(function(row, i) {
          return m('.row', {className: vm.active && (vm.idx == i) ? 'selected' : ''}, function() {
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
            children = children.concat(range(Game.rowSizes[i] - children.length).map(function() {
              return m('.slot.clicky', {
                style: {'z-index': z--}, onclick: vm.setIdx.bind(vm, i) ,
              }, d.drawBlank(vm.active && (i == vm.idx), vm.active));
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
            return m('.row', {style: {'min-width': row.length * 40 + 4 }}, row.map(function(card, i) {
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

        m('.discarded', vm.discarded.map(function(card) {
          return d.draw(card);
        })),
      ]),
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
              toDiscard: ctrl.cards().length - 13,
              oncommit: function(pending) {
                var board = pending;
                ctrl.endgame({ board: board, });
              },
              brain: args.brain,
              active: true,
            }),
          ]);
        }
      })(),
    ]);
  },
};

var FLCalc = {
  controller: function() {
    this.cards = m.prop(p.getDeck().slice(0, 14).sort(p.byRank));
    this.inp = m.prop(p.toHandstr(this.cards()));
    this.a = 1;
    this.b = 0;
    this.refresh = function() {
      console.log('refreshing.\n');
      this.cards(p.parseHandstr(this.inp()));
      console.log(this.cards());
      this.kill = true;
      m.redraw(true);
    };
  },
  view: function(ctrl) {
    if (ctrl.kill) {
      ctrl.kill = false;
      return m('div', 'empty'); // next cycle will recreate components
    }
    return m('div', [
      m.component(FantasyLand, {
        len: 14,
        brain: function(board, pull) {
          // we know this is a fantasy land hand
          var trace = b.getBestPlay(pull).play;
          return [trace._top, trace.mid, trace.bot];
        },
        cards: ctrl.cards(),
      }),
      m('textarea.edit', {
        value: ctrl.inp(),
        oninput: m.withAttr('value', ctrl.inp),
        onkeydown: function(ev) {
          if (ev.code == 'Enter' && !ev.shiftKey && !ev.ctrlKey) {
            ev.preventDefault();
            ctrl.refresh();
          }
        }
      }),
    ]);
  },
};

var App = {
  model: function() {
    var np = 2;
    this.games = range(np).map(function() {
      return {
        fl: false,
        round: 0,
        toDiscard: 0,
        board: [[], [], []],
        pull: [],
        discarded: [],
      };
    });

    this.deal = function() {
      var game = this.games[this.p];
      var size = game.round == 0 ? 5 : 3;
      game.pull = this.deck.slice(0, size);
      game.toDiscard = game.round == 0 ? 0 : 1;
      this.deck.splice(0, size);
    }

    this.play = function(pending) {
      // check if pending is in pull
      var game = this.games[this.p];
      var valid = true;
      range(3).forEach(function(idx) {
        valid = valid && game.board[idx].length + pending[idx].length <= Game.rowSizes[idx];
      });
      var played = pending.reduce(function (a, b) { return a.concat(b); });
      played.forEach(function(card) {
        valid = valid && game.pull.indexOf(card) != -1;
      });
      if (!valid) {
        console.log('invalid play:', pending, game);
        return false;
      }

      game.pull.forEach(function(card) {
        if (played.indexOf(card) == -1) {
          game.discarded.push(card);
        }
      });
      range(3).forEach(function(idx) {
        game.board[idx] = game.board[idx].concat(pending[idx]);
      });
      game.round += 1;

      this.p = (this.p + 1) % np;
      this.deal();
      return true;
    };

    this.deck = p.getDeck();
    this.p = 0;
    this.deal();
  },

  viewmodel: function(np) {
    this.sync = function(m) {
      console.log('syncing to ', m);
      this.done = m.games[m.p].round == 5;
      this.active = m.p == 0;
      this.there = m.games[1].board;
      this.thereFL = m.games[1].fl;
      this.here = m.games[0].board;
      this.hereFL = m.games[0].fl;
      this.pull = m.games[0].pull;
      this.toDiscard = m.games[0].toDiscard;
      this.discarded = m.games[0].discarded;
    };
  },

  ai: function() {
    this.brain = stupidBrain;
  },

  controller: function() {
    this.m = new App.model();
    this.vm = new App.viewmodel();
    this.ai = new App.ai();
    this.vm.sync(this.m);
    this.kill = false;

    this.aimove = function() {
      console.log('aimove.');
      m.startComputation();
      var game = this.m.games[1];
      var pending = this.ai.brain(game.board, game.pull, game.toDiscard, [this.m.games[0].board]);

      console.log(pending);
      this.oncommit(pending);
      m.endComputation();
    };

    this.oncommit = function(pending) {
      this.m.play(pending);
      this.vm.sync(this.m);
      this.kill = true;
      m.redraw(true);
      if (this.m.p == 1) {
        setTimeout(this.aimove.bind(this), 1000);
      }
    };
  },
  view: function(ctrl) {
    if (ctrl.kill) {
      ctrl.kill = false;
      return m('div', 'redrawing'); // next cycle will recreate components
    }
    var vm = ctrl.vm;
    console.log('drawing with', vm);
    return m('div', (function() {
      if (vm.done) {
        return [
          m.component(EndGame, { board: vm.there, wasFL: vm.thereFL, }),
          m.component(EndGame, { board: vm.here, wasFL: vm.hereFL, }),
        ];
      } else {
        return m.component(Game, {
          board: vm.here,
          opp: [vm.there],
          pull: vm.pull,
          toDiscard: vm.toDiscard,
          discarded: vm.discarded,
          active: vm.active,
          oncommit: ctrl.oncommit.bind(ctrl),
          brain: stupidBrain,
        });
      }
    })());
  },
};


m.route(document.body, "/", {
    "/flcalculator": FLCalc,
    "/": App,
});
window.setCards = function(s) {
  ctrl.setCards(s.split(' '));
  m.redraw(true);
}
