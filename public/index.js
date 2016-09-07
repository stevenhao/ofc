(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  window.b = window.b || {};

  function playFL(cards) {
    var memo = range(1<<14).map(function() { return 0; } );
    // try everything?
    var mx = 0;
    var trace = null;
    function mskToCards(msk) {
       return cards.take(range(14).filter(function(i) {
          return msk & (1 << i);
       }));
    }

    function mskToHand(msk) {
      memo[msk] = memo[msk] || p.getPokerHand(mskToCards(msk));
      return memo[msk];
    }

    function check(_top, mid, bot) {
      var score = p.scorePineapple(mskToHand(_top), mskToHand(mid), mskToHand(bot));
      if (score > mx) {
        mx = score;
        trace = {_top: mskToCards(_top), mid: mskToCards(mid), bot: mskToCards(bot)};
      }
    }

    function ppcnt(x) {
      var ret = 0;
      while (x) {
        ret += 1;
        x -= x & -x;
      }
      return ret;
    }

    // generate the guy!
    var steps = 0;
    var bots = 0;
    var n = 14;
    var pthres = 999;
    for (var thres of [3, 2, 1]) {
      if (thres == 2 && mx >= 9) { // thres == 2 --> only looking for 2 pairs on bot.
        break;
      }
      if (thres == 1 && mx >= 7) { // thres == 1 --> only looking for pairs on bot
        break;
      }
      for (var a = (1 << n) - 1; a > 0; a = (a - 1)) {
        //if (steps > 1000) break;
        if (ppcnt(a) == 5) {
          var bot = mskToHand(a);
          if (bot.tier >= pthres || bot.tier < thres) continue;
          bots += 1;
          var msk = ((1 << n) - 1) & (~a);
          for (var b = (1 << n) - 1; b > 0; b = (b - 1) & msk) {
            var mid = mskToHand(b);
            steps += 1;
            // ensure a & b == 0, i.e. bot, mid are disjoint
            if (ppcnt(b) == 5) {
              var msk2 = msk & (~b);
              for (var c = (1 << n) - 1; c > 0; c = (c - 1) & msk2) {
                steps += 1;
                if (ppcnt(c) == 3) {
                  check(c, b, a);
                }
              }
            }
          }
        }
      }
      pthres = thres;
    }

    return {royalty: mx, play: trace}
  }
  b.playFL = playFL;
})();

},{}],2:[function(require,module,exports){
(function() {
  window.d = window.d || {};
  d.colors = {
    's': 'black',
    'c': '#009600',
    'h': 'red',
    'd': '#0070A1',
  }

  d.paths = {
    'h': 'm 0 0 c -66.24,0 -120,53.76 -120,120 0,134.75551 135.93315,170.0873 228.56245,303.31 87.57424,-132.40336 228.5625,-172.8546 228.5625,-303.31 0,-66.24 -53.76,-120 -120,-120 -48.0479,0 -89.4016,28.37 -108.5625,69.1875 -19.1608,-40.81708 -60.5145,-69.18751 -108.5625,-69.1875 z',
    'd': 'M 408.15635,352.45099 C 385.76859,400.21284 352.76072,442.26342 308.15635,478.0625 C 352.76072,513.86156 385.76859,555.91215 408.15635,603.674 C 430.54411,555.91215 463.55198,513.86156 508.15635,478.0625 C 463.55198,442.26342 430.54411,400.21284 408.15635,352.45099 z',
    's': 'M 420.37498,349.55102 C 360.40052,390.08152 320.37505,467.57634 320.375,514.71623 C 320.375,539.21657 340.29885,560.81235 366.92151,560.81235 C 388.48053,560.81235 406.86151,541.23743 406.86146,514.26579 C 406.86146,510.20054 408.9958,508.40994 410.76536,508.40994 C 413.08604,508.40994 415.42002,511.71285 415.42002,518.01954 C 415.42002,533.65083 407.57185,573.31705 396.95155,597.44898 C 403.08128,595.63666 411.25603,593.8454 420.37498,593.8454 C 429.49402,593.8454 437.81882,595.63666 443.94856,597.44898 C 433.32825,573.31705 425.48008,533.65083 425.48008,518.01954 C 425.48008,511.71285 427.81406,508.40994 430.13474,508.40994 C 431.9043,508.40994 433.88849,510.20054 433.88849,514.26579 C 433.88854,541.23743 452.41957,560.81235 473.97859,560.81235 C 500.60125,560.81235 520.375,539.21657 520.375,514.71623 C 520.37505,467.57634 480.34948,390.08152 420.37498,349.55102 z',
    'c': 'M 408.15639,368.79905 C 379.39014,368.79906 356.02769,392.16149 356.02769,420.92775 C 356.02772,441.41782 367.85955,459.15021 385.07688,467.65086 C 390.25818,470.20901 384.60395,476.8313 380.79941,472.53939 C 371.24485,461.76088 357.31062,454.95947 341.78513,454.95947 C 313.01888,454.95946 289.65635,478.32191 289.65635,507.08817 C 289.65635,535.85443 313.01903,559.16987 341.78513,559.16987 C 370.33092,559.16987 393.61306,536.20881 393.91384,507.74624 C 393.96721,502.69704 401.7167,502.17398 401.7167,508.96838 C 401.7167,519.66771 391.43054,576.49172 385.92297,587.32595 C 391.9345,585.8101 401.95338,584.55266 408.15639,584.55265 C 414.35941,584.55266 424.37829,585.8101 430.38982,587.32595 C 424.88225,576.49172 414.59609,519.66771 414.59609,508.96838 C 414.59609,502.17398 422.34558,502.69704 422.39895,507.74624 C 422.69973,536.20881 445.98193,559.16987 474.52765,559.16987 C 503.29392,559.16987 526.65632,535.85443 526.65635,507.08817 C 526.65635,478.32191 503.29392,454.95946 474.52765,454.95947 C 459.00226,454.95947 445.06794,461.76088 435.51338,472.53939 C 431.70884,476.8313 426.05461,470.20901 431.23591,467.65086 C 448.45324,459.15021 460.28507,441.41782 460.28509,420.92775 C 460.28509,392.16149 436.92265,368.79906 408.15639,368.79905 z',
  }
  var kk = 'translate(-100, -90) scale(0.55)';
  d.transforms = {
    'h': 'translate(100, 120) scale(0.27)',
    'd': kk,
    's': kk,
    'c': kk,
  }


  function drawGrid(w, h) {
    function line(x1, y1, x2, y2) {
      return m('line', {x1, y1, x2, y2,
        style: 'stroke:#CCC;stroke-width:0.5'
      });
    }

    var ret = [];
    for (var x = 0; x <= w; x += 10) {
      var margin = 8;
      if (x % 40 == 20 && x < w) {
        ret.push(line(x, 0, x, h - margin));
        ret.push(m('text', {
          x: x - 2,
          y: h - margin + 5,
          'font-size': 4,
          },
          x));
      } else {
        ret.push(line(x, 0, x, h));
      }
    }
    for (var y = 0; y <= h; y += 10) {
      var margin = 8;
      if (y % 40 == 20 && y < h) {
        ret.push(line(0, y, w - margin, y));
        ret.push(m('text', {
          x: w - margin + 2,
          y: y + 1,
          'font-size': 4,
          },
          y));
      } else {
        ret.push(line(0, y, w, y));
      }
    }

    return ret;
  }

  function drawBack(w, h) {
    return m('rect', {
      width: w,
      height: h,
    });
  }

  function drawRank(rank) {
    return m('text.rank-text', {
        x: rank == 'T' ? 5 : 15,
        y: 100,
        'font-size': 110
      },
      rank == 'T' ? '10' : rank
      );
  }

  function drawSuit(suit) {
    return m('g', {
        transform: d.transforms[suit],
      }, m('path', {
        d: d.paths[suit],
        style: 'fill-opacity:1.0000000;fill-rule:evenodd;',
      })
    );
  }

  function drawBlank() {
    return m('svg.card.blank', {
      viewBox:'0 0 200 250',
    }, m('g', drawBack(200, 250, '#4daf9c', '#00cc00')));
  }

  function draw(card, showGrid) {
    return m('svg.card', {viewBox:'0 0 200 250'}, function() {
      var els = [];
      els = els.concat([ m('g', drawBack(200, 250)) ]);
      var rank = p.getRank(card), suit = p.getSuit(card);
      var color = d.colors[suit];
      els = els.concat([
        m('g', showGrid ? drawGrid(200, 250) : []),
        m('g', {fill: color}, drawRank(rank)),
        m('g', {fill: color}, drawSuit(suit)),
      ]);
      return els;
    }());
  }

  function drawFoul(card, showGrid) {
    if (card) {
      return m('svg.card', {
        viewBox:'0 0 200 250',
        style: {
          transform: 'rotate(' + (Math.random() - 0.5) * 60+ 'deg)',
        }
      }, function() {
        var els = [];
        if (card) {
          els = els.concat([ m('g', drawBack(200, 250, '#CCC', '#CCC')) ]);
          var rank = p.getRank(card), suit = p.getSuit(card);
          var color = d.colors[suit];
          els = els.concat([
            m('g', showGrid ? drawGrid(200, 250) : []),
            m('g', {fill: color}, drawRank(rank)),
            m('g', {fill: color}, drawSuit(suit)),
          ]);
        }
        return els;
      }());
    } else {
      return m('svg.card.blank', {viewBox:'0 0 200 250'}, m('g', drawBack(200, 250, '#5daf9c', '#00cc00')));
    }
  }

  d.draw = draw;
  d.drawBlank = drawBlank;
  d.drawFoul = drawFoul;
})();

},{}],3:[function(require,module,exports){
'use strict';

var drawtest = drawtest || {};
drawtest.controller = function() {
  this.feature = m.prop('As');
};

drawtest.view = function(ctrl) {
  return m('div',{style:{'background-color': '#CCC'}}, [
    m('div.poker-holder', {style: 'width: 300px; height: 375px'}, d.draw(ctrl.feature(), true)),
    m('div',{style: 'max-width:600px'}, p.allCards.map(function(card) {
        return m("div.poker-holder",
            {style: 'width: 30px; height: 37.5px; display: inline-block',
              onclick: function() {ctrl.feature(card);}},
            d.draw(card));
      })),
    ]);

};
m.module(document.body, {
  controller: drawtest.controller,
  view: drawtest.view,
});

},{}],4:[function(require,module,exports){
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
      m('.there', {className: [
          !vm.active ? 'active' : 'inactive',
        ].join(' ') },
        vm.opp.map(function(board, idx) {
          return m('.board', board.map(function(row, i) {
            return m('.row', function() {
              var z = 8, p = 8;
              return row.map(function(card) {
                return m('.slot', {style: {'z-index': z--}}, d.draw(card));
              }).concat(
                range(Game.rowSizes[i] - row.length).map(function() {
                  return m('.slot', {
                    style: {'z-index': z--},
                  }, d.drawBlank(false, !vm.active));
                }));
            }());
          }));
      })),
     m('.here', {className: [
          vm.active ? 'active' : 'inactive',
        ].join(' ') }, [
          m('.board', vm.board.map(function(row, i) {
            return m('.row', [
              m('.cards', {className: vm.active && (vm.idx == i) ? 'selected' : ''}, function() {
                var z = 8, p = 8;
                return row.map(function(card) {
                  return m('.slot',
                      {style: {'z-index': z--}}, vm.foul ? d.drawFoul(card) : d.draw(card));
                }).concat(vm.pending[i].map(function(card) {
                  return m('.slot.pending.clicky', {
                    style: {'z-index': (p++) + (z--)},
                    onclick: vm.unuse.bind(vm, card),
                  }, d.draw(card));
                })).concat(range(Game.rowSizes[i] - row.length - vm.pending[i].length).map(function() {
                  return m('.slot.clicky', {
                    style: {'z-index': z--}, onclick: vm.setIdx.bind(vm, i) ,
                  }, d.drawBlank(vm.active && (i == vm.idx), vm.active));
                }));
              }()),
              function() {
                if (!vm.ended) return null;
                var bonus = vm.bonuses[i];
                var bstr = bonus.name + '!&nbsp;&nbsp;+' + bonus.royalty;
                return m('.bonus', {className: bonus.fl ? 'fl' : ''}, m.trust(bstr));
              }(),
            ]);
          })),

          m('.pull', { className: vm.endgame ? 'hide' : '' }, (function(cards) {
            var r = 1; while (cards.length / r > r * 2 + 5) r += 1; // split, at most 1x7, 2x9, 3x11, etc
            var pos = 0;
            return range(r).map(function(i) {
              var len = Math.floor((cards.length - pos) / (r - i));
              pos += len;
              return cards.slice(pos - len, pos);
            }).map(function(row) {
              return m('.row', {style: {'min-width': row.length*40+4 }}, row.map(function(card, i) {
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
           var showCommit = vm.active && vm.done();
           var showBrain = vm.active && vm.brain;
           var showSort = vm.active;
            return [
              m('.btn.round.sort', showSort ?
                  { onclick: vm.sort.bind(vm) } :
                  { className: 'hide' }, 'SORT'),
              m('.btn.round.commit', showCommit ?
                  { onclick: vm.commit.bind(vm) } :
                  { className: 'hide' } , 'SET'),
              m('.btn.wide.help', showBrain ?
                  { onclick: vm.help.bind(vm) } :
                  { className: 'hide' } , 'Ask God'),
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
    this.active = m.prop(true);
    this.board = m.prop([[], [], []]);
    this.oncommit = function(pending) {
      this.board(pending);
      this.active(false);
      this.kill = true;
      m.redraw(true);
    };
    this.kill = false;
  },
  view: function(ctrl, args) {
    if (ctrl.kill) {
      ctrl.kill = false;
      return m('div', 'redrawing'); // next cycle will recreate components
    }
    return m('div', [
      (function() {
        return m('div', [
          m.component(Game, {
            active: ctrl.active(),
            endgame: !ctrl.active(),
            board: ctrl.board(),
            isFL: true,
            pull: ctrl.cards(),
            toDiscard: ctrl.cards().length - 13,
            oncommit: ctrl.oncommit.bind(ctrl),
            brain: args.brain,
          }),
        ]);
      })(),
    ]);
  },
};

var FLCalc = {
  controller: function(args) {
    this.cards = m.prop(p.getDeck().slice(0, 14).sort(p.byRank));
    if (m.route.param("cardstr")) {
      var cardstr = m.route.param("cardstr");
      cardstr = range(cardstr.length/2).map(function(i) {
        return cardstr.substr(i*2, 2);
      }).join(' ');
      this.cards(p.parseHandstr(cardstr));
    }
    this.inp = m.prop(p.toHandstr(this.cards()));
    this.a = 1;
    this.b = 0;
    this.refresh = function() {
      var cardstr = this.inp();
      cardstr = this.inp().split(/\s+/).join('');
      m.route("/fl/" + cardstr);
    };
  },
  view: function(ctrl, args) {
    return m('div', [
      m.component(FantasyLand, {
        len: 14,
        brain: function(board, pull) {
          // we know this is a fantasy land hand
          var trace = b.playFL(pull).play;
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

m.route.mode = "hash";
m.route(document.body, "/", {
    "/fl/:cardstr": FLCalc,
    "/fl": FLCalc,
    "/play": App,
    "/": FLCalc,
});

},{}],5:[function(require,module,exports){
(function() {
  if (!p.getPokerHand) {
    console.error("poker.js not included. pineapple.js will not run.");
    return;
  }

  var bonuses = new Map([
      [p.tiers.Straight, 2],
      [p.tiers.Flush, 4],
      [p.tiers.FullHouse, 6],
      [p.tiers.FourOfAKind, 10],
      [p.tiers.StraightFlush, 15],
      [p.tiers.RoyalFlush, 25],
    ])

  function topBonus(hand, wasFL) {
    var ret = 0;
    var value = Math.floor(hand.kickerValue); // this gives the main part of the hand (0-th kicker)
    var rankName = p.getPluralStr(p.numToRank(value));
    if (hand.tier == p.tiers.ThreeOfAKind) {
      return {
        name: 'Three of a Kind ' + rankName,
        royalty: value + 8,
        fl: true,
      }
    } else if (hand.tier == p.tiers.Pair && value >= 6) {
      return {
        name: rankName,
        royalty: Math.max(0, value - 5),
        fl: value >= 12 && !wasFL,
      }
    } else {
      return {
        name: hand.name,
        royalty: 0,
        fl: false,
      };
    }
  }

  function midBonus(hand, wasFL) {
    var royalty = 0;
    var fl = wasFL && (hand.tier >= p.tiers.FourOfAKind);
    if (bonuses.has(hand.tier)) {
      royalty = bonuses.get(hand.tier) * 2;
    } else if (hand.tier == p.tiers.ThreeOfAKind) {
      royalty = 2;
    }

    return { name: hand.name, royalty: royalty, fl: fl, }
  }

  function botBonus(hand, wasFL) {
    var royalty = 0;
    var fl = wasFL && (hand.tier >= p.tiers.FourOfAKind);
    if (bonuses.has(hand.tier)) {
      royalty = bonuses.get(hand.tier);
    }

    return { name: hand.name, royalty: royalty, fl: fl, }
  }

  function legal(top_, mid, bot) {
    return !p.betterPokerHand(mid, bot) && !p.betterPokerHand(top_, mid);
  }

  function scorePineapple(top_, mid, bot) {
    if (legal(top_, mid, bot)) {
      var a = topBonus(top_), b = midBonus(mid), c = botBonus(bot);
      return a.royalty + b.royalty + c.royalty;
    } else {
      return 0;
    }
  }

  p.scorePineapple = scorePineapple;
  p.topBonus = topBonus;
  p.midBonus = midBonus;
  p.botBonus = botBonus;

  p.getBonus = function(hand, idx, wasFL) {
    return [topBonus, midBonus, botBonus][idx](hand, wasFL);
  }

  function fillSuit(s) {
    if (s.length == 1) {
      s += 's';
    }
    return s;
  }

  p.ss = function(s) {
    return p.getPokerHand(s.split(' ').map(fillSuit));
  }
})();

},{}],6:[function(require,module,exports){
/*
 * p.lookupTable: object with 6188 keys, mpas sorted-rank-strings to hands,
 * e.g. p.lookupTable['KK444'] = {name: 'Full House', tier: 6, kickerValue: 93}
 * p.getPokerHand: function that takes a list of card-strings and returns a hand,
 * e.g. p.getPokerHand(['As', 'Ks', 'Qs', 'Js', 'Ts']) == 
 *
 * */
(function() {
  window.p = window.p || {};
  p.tiers = {};
  p.handNames = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];
  p.rankNames = { '2': 'Twos', '3': 'Threes', '4': 'Fours', '5': 'Fives', '6': 'Sixes', '7': 'Sevens', '8': 'Eights', '9': 'Nines', 'T': 'Tens', 'J': 'Jacks', 'Q': 'Queens', 'K': 'Kings', 'A': 'Aces', }
 

  function getPluralStr(rank) {
    return p.rankNames[rank];
  }

  function cap(str) { return str[0].toUpperCase() + str.slice(1).toLowerCase(); }
  function camel(str) { return str.split(' ').map(cap).join(''); }

  p.allRanks = '23456789TJQKA'.split('');
  p.allSuits = 'dchs'.split('');
  p.allCards = p.allRanks.flatMap(function(rank) {
    return p.allSuits.map(function(suit) {
      return rank + suit;
    });
  });
  function getDeck() {
    var deck = p.allCards.slice();
    deck.shuffle();
    return deck;
  }
  function numToRank(num) { return ('xA23456789TJQKA').charAt(num); }
  function rankToNum(rank) { return ('xx23456789TJQKA').indexOf(rank); }
  function rankOrder(a, b) { return rankToNum(b) - rankToNum(a); }
  function suitOrder(a, b) { return p.allSuits.indexOf(b) - p.allSuits.indexOf(a); }
  function getRank(card) { return card[0]; }
  function getSuit(card) { return card[1]; }
  function byRank(cardA, cardB) {
    if (getRank(cardA) == getRank(cardB)) return suitOrder(getSuit(cardA), getSuit(cardB));
    return rankOrder(getRank(cardA), getRank(cardB));
  }
  function bySuit(cardA, cardB) {
    if (getSuit(cardA) == getSuit(cardB)) return rankOrder(getRank(cardA), getRank(cardB));
    return suitOrder(getSuit(cardA), getSuit(cardB));
  }
  function lookupName(tier) { return p.handNames[tier]; }
  function pokerHand(tier, kickerValue) { return { name: lookupName(tier), tier: tier, kickerValue: kickerValue, } }
  function incompleteHand() { return { name: 'incomplete', tier: -1, kickerValue: -1, } }

  p.handNames.forEach(function(name, tier) {
    p.tiers[camel(name)] = tier;
    p[camel(name)] = function() {
      var kickerValue = 0;
      var multiplier = 1;
      Array.from(arguments).map(rankToNum).forEach(function(num) {
        kickerValue += multiplier * num;
        multiplier *= 0.01;
      });
      return pokerHand(tier, kickerValue);
    }; // so we can say Flush(3)
  });


  function betterPokerHand(handA, handB) {
    if (handA.tier == handB.tier) {
      return handA.kickerValue > handB.kickerValue;
    } else {
      return handA.tier > handB.tier;
    }
  }

  function makeLookupTable() { // takes ~100 ms on Intel i5-6600 3.30 GHz, Chrome 51.0
    var table = {};
    function yield(ranks, hand) {
      var s = ranks.slice().sort(rankOrder).join('');
      if (!(s in table) || betterPokerHand(hand, table[s])) {
        table[s] = hand;
      }
    }

    // 5-card hands
    for (var a = 1; a + 4 <= 14; ++a) {
      // straight
      yield([a, a+1, a+2, a+3, a+4].map(numToRank), p.Straight(numToRank(a+4)));
    }
    p.allRanks.forEach(function(a) {
      p.allRanks.forEach(function(b) {
        // four of a kind
        yield([a, a, a, a, b], p.FourOfAKind(a, b));
        // full house
        yield([a, a, a, b, b], p.FullHouse(a, b));
        p.allRanks.forEach(function(c) {
          // three of a kind
          yield([a, a, a, b, c], p.ThreeOfAKind(a, b, c));
          // two pair
          yield([a, a, b, b, c], p.TwoPair(a, b, c));
          p.allRanks.forEach(function(d) {
            if (a == b || a == c || a == d || b == c || b == d || c == d ||
                b < c || c < d) return; // speed up #1
            // pair
            yield([a, a, b, c, d], p.Pair(a, b, c, d));
            p.allRanks.forEach(function(e) {
              if (a == e || b == e || c == e || d == e ||
                a < b || d < e) return; // spped up #2
              // high card
              yield([a, b, c, d, e], p.HighCard(a, b, c, d, e));
            });
          });
        });
      });
    });

    // 3-card hands
    p.allRanks.forEach(function(a) {
      yield([a, a, a], p.ThreeOfAKind(a));
      p.allRanks.forEach(function(b) {
        yield([a, a, b], p.Pair(a, b));
        p.allRanks.forEach(function(c) {
          // high card
          yield([a, b, c], p.HighCard(a, b, c));
        });
      });
    });

    return table;
  }

  p.lookupTable = makeLookupTable();
  function lookupHand(ranks) {
    var r = ranks.slice(); // copy it before modifying
    r.sort(rankOrder);
    return p.lookupTable[r.join('')];
  }

  function getPokerHand(cards) {
    for (var card of cards) {
      if (card == undefined) {
        return incompleteHand();
      }
    }

    ranks = cards.map(getRank);
    suits = cards.map(getSuit);
    var ret = lookupHand(ranks);

    if (suits.join('') == suits[0].repeat(5)) { // we are in flush mode
      var r = ranks.slice();
      r.sort(rankOrder);
      if (ret.tier == p.tiers.Straight) {
        if (ret.kickerValue == 14) {
          return p.RoyalFlush();
        } else {
          return p.StraightFlush(r[0]);
        }
      } else {
        return p.Flush(r[0], r[1], r[2], r[3], r[4]);
      }
    } else {
      return ret;
    }
  }

  function parseHandstr(handstr) {
    return handstr.split(/\s+/);
  }

  function toHandstr(hand) {
    return hand.join(' ');
  }

  p.parseHandstr = parseHandstr;
  p.toHandstr = toHandstr;
  p.getPokerHand = getPokerHand;
  p.betterPokerHand = betterPokerHand;
  p.getDeck = getDeck;
  p.getRank = getRank;
  p.getSuit = getSuit;
  p.numToRank = numToRank;
  p.rankToNum = rankToNum;
  p.byRank = byRank;
  p.bySuit = bySuit
  p.getPluralStr = getPluralStr;
})();

},{}],7:[function(require,module,exports){
function nop() {}
function cp(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function range(x, y) {
  if (y == undefined) {
    y = x;
    x = 0;
  }
  var ret = [];
  for (var i = x; i < y; i += 1) {
    ret.push(i);
  }
  return ret;
}

Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

Array.prototype.shuffle = function() {
    var j, x, i;
    for (i = this.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = this[i - 1];
        this[i - 1] = this[j];
        this[j] = x;
    }
}

Array.prototype.take = function(indices) {
  return indices.map(function(idx) {
    return this[idx];
  }.bind(this));
}

Array.prototype.contains = function(el) {
  return this.indexOf(el) != -1;
};

Array.prototype.remove = function(el) {
  if (this.indexOf(el) != -1) {
    this.splice(this.indexOf(el), 1);
  }
};

},{}]},{},[1,2,3,4,5,6,7]);
