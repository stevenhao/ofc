(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Card = require('./card');
module.exports = function(args) {
  console.log('Actions', args);
  var pull = args.pull || [];
  var used = args.used || [];
  var r = 1; while (pull.length / r > r * 2 + 5) r += 1;

  var slots = m('.pull', range(r).map(function(i) {
    return pull.splice(0, Math.floor(pull.length / (r - i)));
  }).map(function(row) {
    return m('.row',
      {style: {'min-width': row.length*40+4 }},
      row.map(function(card, i) {
        if (used.contains(card)) {
          return m('.slot', {
          });
        } else {
          return m('.slot.clicky', {
            onclick: function() { args.onuse(card) },
          }, Card(card));
        }
      }));
  }));

  var pullBtn = m('.btn.round.help', args.canpull ?
        { onclick: args.onpull } :
        { className: 'hide' } , 'Pull');
  var buttons = m('.buttons', [
    m('.btn.round.sort', args.cansort ?
        { onclick: args.onsort } :
        { className: 'hide' }, 'SORT'),
    m('.btn.round.commit', args.cancommit ?
        { onclick: args.oncommit } :
        { className: 'hide' } , 'SET'),
    m('.btn.wide.help', args.canhelp ?
        { onclick: args.onhelp } :
        { className: 'hide' } , 'Ask God'),
  ]);

  return m('.actions', [ slots, pullBtn, buttons ]);
}

},{"./card":3}],2:[function(require,module,exports){
var U = require('../share/utils');
var Card = require('./card');
var rowSizes = [3, 5, 5];
function BoardView(args) {
  console.log('boardview', args);
  var player = args.player;
  var board = args.board;
  var pending = args.pending || [[], [], []];
  var selected = 'selected' in args ? args.selected : -1;
  var active = args.active || false;
  var over = args.over || false;
  var fouled = args.fouled || false;
  var royalties = args.royalties;
  return m('.board',
    { className: active ? 'active' : 'inactive' },
    board.map(function(row, i) {
      return m('.row',
        { className: selected == i ? 'selected' : '' },
        [
          m('.cards', (function() {
            var y = 8, z = 8;
            var A = row.map(function(card) {
              return m('.slot',
                { style: {'z-index': z--} },
                Card(card, { fouled: fouled }));
            });
            var B = pending[i].map(function(card) {
              return m('.slot.pending.clicky',
                { style: {'z-index': y++ + z--},
                  onclick: function() { args.onclickcard(card) },
                },
                Card(card));
            });
            var C = U.range(rowSizes[i] - A.length - B.length).map(function() {
              return m('.slot',
                { style: {'z-index': z--},
                  className: args.onclickrow ? 'clicky' : '',
                  onclick: function() { args.onclickrow(i) },
                },
                Card('', {blank: true}));
            });
            return A.concat(B).concat(C);
          })()),
          (function() {
            if (!over) return null;
            var bonus = royalties[i];
            if (!bonus || !bonus.royalty) return null;
            var bstr = bonus.name + '!&nbsp;&nbsp;+' + bonus.royalty;
            return m('.bonus', {className: bonus.fl ? 'fl' : ''}, m.trust(bstr));
          })(),
        ]);
    }));
}
module.exports = BoardView;

},{"../share/utils":6,"./card":3}],3:[function(require,module,exports){
var Poker = require('../share/poker');

var colors = {
  's': 'black',
  'c': '#009600',
  'h': 'red',
  'd': '#0070A1',
}

var paths = {
  'h': 'm 0 0 c -66.24,0 -120,53.76 -120,120 0,134.75551 135.93315,170.0873 228.56245,303.31 87.57424,-132.40336 228.5625,-172.8546 228.5625,-303.31 0,-66.24 -53.76,-120 -120,-120 -48.0479,0 -89.4016,28.37 -108.5625,69.1875 -19.1608,-40.81708 -60.5145,-69.18751 -108.5625,-69.1875 z',
  'd': 'M 408.15635,352.45099 C 385.76859,400.21284 352.76072,442.26342 308.15635,478.0625 C 352.76072,513.86156 385.76859,555.91215 408.15635,603.674 C 430.54411,555.91215 463.55198,513.86156 508.15635,478.0625 C 463.55198,442.26342 430.54411,400.21284 408.15635,352.45099 z',
  's': 'M 420.37498,349.55102 C 360.40052,390.08152 320.37505,467.57634 320.375,514.71623 C 320.375,539.21657 340.29885,560.81235 366.92151,560.81235 C 388.48053,560.81235 406.86151,541.23743 406.86146,514.26579 C 406.86146,510.20054 408.9958,508.40994 410.76536,508.40994 C 413.08604,508.40994 415.42002,511.71285 415.42002,518.01954 C 415.42002,533.65083 407.57185,573.31705 396.95155,597.44898 C 403.08128,595.63666 411.25603,593.8454 420.37498,593.8454 C 429.49402,593.8454 437.81882,595.63666 443.94856,597.44898 C 433.32825,573.31705 425.48008,533.65083 425.48008,518.01954 C 425.48008,511.71285 427.81406,508.40994 430.13474,508.40994 C 431.9043,508.40994 433.88849,510.20054 433.88849,514.26579 C 433.88854,541.23743 452.41957,560.81235 473.97859,560.81235 C 500.60125,560.81235 520.375,539.21657 520.375,514.71623 C 520.37505,467.57634 480.34948,390.08152 420.37498,349.55102 z',
  'c': 'M 408.15639,368.79905 C 379.39014,368.79906 356.02769,392.16149 356.02769,420.92775 C 356.02772,441.41782 367.85955,459.15021 385.07688,467.65086 C 390.25818,470.20901 384.60395,476.8313 380.79941,472.53939 C 371.24485,461.76088 357.31062,454.95947 341.78513,454.95947 C 313.01888,454.95946 289.65635,478.32191 289.65635,507.08817 C 289.65635,535.85443 313.01903,559.16987 341.78513,559.16987 C 370.33092,559.16987 393.61306,536.20881 393.91384,507.74624 C 393.96721,502.69704 401.7167,502.17398 401.7167,508.96838 C 401.7167,519.66771 391.43054,576.49172 385.92297,587.32595 C 391.9345,585.8101 401.95338,584.55266 408.15639,584.55265 C 414.35941,584.55266 424.37829,585.8101 430.38982,587.32595 C 424.88225,576.49172 414.59609,519.66771 414.59609,508.96838 C 414.59609,502.17398 422.34558,502.69704 422.39895,507.74624 C 422.69973,536.20881 445.98193,559.16987 474.52765,559.16987 C 503.29392,559.16987 526.65632,535.85443 526.65635,507.08817 C 526.65635,478.32191 503.29392,454.95946 474.52765,454.95947 C 459.00226,454.95947 445.06794,461.76088 435.51338,472.53939 C 431.70884,476.8313 426.05461,470.20901 431.23591,467.65086 C 448.45324,459.15021 460.28507,441.41782 460.28509,420.92775 C 460.28509,392.16149 436.92265,368.79906 408.15639,368.79905 z',
}
var transforms = {
  'h': 'translate(100, 120) scale(0.27)',
  'd': 'translate(-100, -90) scale(0.55)',
  's': 'translate(-100, -90) scale(0.55)',
  'c': 'translate(-100, -90) scale(0.55)',
}
function draw(card) {
  return m('svg.card', {viewBox:'0 0 200 250'}, function() {
    var els = [];
    els = els.concat([ m('g', drawBack(200, 250)) ]);
    var rank = p.getRank(card), suit = p.getSuit(card);
    var color = d.colors[suit];
    els = els.concat([
      m('g', {fill: color}, drawRank(rank)),
      m('g', {fill: color}, drawSuit(suit)),
    ]);
    return els;
  }());
}

function drawFoul(card, showGrid) {
  if (card) {
    return m('svg.card.foul', {
      viewBox:'0 0 200 250',
      style: {
      }
    }, function() {
      var els = [];
      els = els.concat([ m('g', drawBack(200, 250)) ]);
      var rank = p.getRank(card), suit = p.getSuit(card);
      var color = d.colors[suit];
      els = els.concat([
        m('g', {fill: color}, drawRank(rank)),
        m('g', {fill: color}, drawSuit(suit)),
      ]);
      return els;
    }());
  } else {
    return m('svg.card.blank', {viewBox:'0 0 200 250'}, m('g', drawBack(200, 250)));
  }
}

module.exports = function(card, options) {
  options = options || {};
  if (options.blank) {
    return m('svg.card.blank', {
      viewBox:'0 0 200 250',
    }, m('rect', { width: 200, height: 250, }));
  } else {
    var r = Poker.getRank(card), s = Poker.getSuit(card);
    return m('svg.card', {
      viewBox:'0 0 200 250',
      style: {
        transform: options.fouled ? ('rotate(' + (Math.random() - 0.5) * 40+ 'deg)') : '',
      },
      className: options.fouled ? 'foul' : '',
    }, [
      m('rect', { width: 200, height: 250, }),
      m('g', { fill: colors[s] },
        m('text.rank-text',
          { x: r == 'T' ? 5 : 15, y: 100, 'font-size': 110 },
          (r == 'T') ? '10' : r),
        m('path', { d: paths[s], transform: transforms[s], style: 'fill-opacity:1.0000000;fill-rule:evenodd;', })),
    ]);
  }
}


},{"../share/poker":5}],4:[function(require,module,exports){
var Poker = require('../share/poker');
var Board = require('./Board');
var Card = require('./card');
var Actions = require('./Actions');
var U = require('../share/utils');

var Game = {
  rowSizes: [3, 5, 5],
  viewmodel: function(ppp) {
    this.init = function() {
      this.pull = ppp.pull;
      this.pending = [[], [], []];
      this.used = [];
      this.idx = 2;
      this.moveIdx(0, -1);
      this.sortBy = 'byRank';
    };

    this.setIdx = function(idx) { this.idx = idx; };

    this.moveIdx = function(dir1, dir2) {
      var j = (this.idx + dir1 + 3) % 3;
      for(var i = 0; i < 2; i += 1, j = (j + dir2 + 3) % 3) {
        if (this.pending[j].length + ppp.board[j].length < Game.rowSizes[j]) break;
      }
      this.idx = j;
    };

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

    this.sort = function() {
      this.sortBy = this.sortBy == 'byRank' ? 'bySuit' : 'byRank';
      this.pull.sort(Poker[this.sortBy]);
    };

    this.done = function() { return this.used.length + ppp.toDiscard == this.pull.length; };

    this.init();
  },

  controller: function(args) {
    var oncommit = args.oncommit || function() {};
    var onpull = args.onpull || function() {};
    this.brain = args.brain;
    this.vm = new Game.viewmodel(args.perspective);
    this.help = function() {
      if (!this.brain) return;
      var vm = this.vm;
      vm.used.slice().forEach(vm.unuse.bind(vm));
      var play = this.brain(args.perspective);
      play.forEach(function(row, i) {
        vm.idx = i;
        row.forEach(function(card) {
          vm.use(card);
        });
      });
    };
    this.commit = function() { oncommit(this.vm.pending); };
    this.sort = function() { this.vm.sort(); }
    this.pull = function() { onpull(); };
  },

  view: function(ctrl, args) {
    var ppp = args.perspective;
    var vm = ctrl.vm;
    var me = ppp.me;
    var opps = U.clone(ppp.boards); opps.splice(me, 1);
    var royalties = ppp.royalties || ppp.players.map(U.c([null, null, null]));
    console.log('game view', JSON.stringify(ppp));
    var fouled = (ppp.fouled) || ppp.players.map(U.c(false));
    console.log('foulde', fouled);
    var pending = (vm.pending) || [[],[],[]];
    return m('.game', [

      m('.there', opps.map(function(board, _p) {
        var p = _p + (_p >= me);
        return Board({
          board: board,
          active: ppp.turn == p,
          over: ppp.over,
          fouled: fouled[p],
          royalties: royalties[p],
        });
      })),

      m('.here', [
        Board({
          board: ppp.board,
          active: ppp.turn == me,
          pending: pending,
          over: ppp.over,
          fouled: fouled[me],
          royalties: royalties[me],
          selected: ppp.turn == me && vm.pull && vm.idx,
          onclickrow: vm.setIdx.bind(vm),
          onclickcard: vm.unuse.bind(vm),
        }),

        Actions({
          pull: U.clone(vm.pull),
          used: U.clone(vm.used),

          canpull: ppp.turn == me && !vm.pull,
          cansort: 1 && vm.pull,
          cancommit: vm.pull && vm.done(),
          canhelp: vm.pull && ctrl.brain,

          onuse: vm.use.bind(vm),
          onsort: ctrl.sort.bind(ctrl),
          oncommit: ctrl.commit.bind(ctrl),
          onhelp: ctrl.help.bind(ctrl),
          onpull: ctrl.pull.bind(ctrl),
        }),

        m('.discarded', ppp.discarded.map(function(card) {
          return Card(card);
        })),
      ]),
    ])
  },
};

module.exports = Game;

},{"../share/poker":5,"../share/utils":6,"./Actions":1,"./Board":2,"./card":3}],5:[function(require,module,exports){
/*
 * p.lookupTable: object with 6188 keys, mpas sorted-rank-strings to hands,
 * e.g. p.lookupTable['KK444'] = {name: 'Full House', tier: 6, kickerValue: 93}
 * p.getPokerHand: function that takes a list of card-strings and returns a hand,
 * e.g. p.getPokerHand(['As', 'Ks', 'Qs', 'Js', 'Ts']) == 
 *
 * */
module.exports = (function() {
  var p = {};
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
  function makeDeck() {
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
  p.makeDeck = makeDeck;
  p.getRank = getRank;
  p.getSuit = getSuit;
  p.numToRank = numToRank;
  p.rankToNum = rankToNum;
  p.byRank = byRank;
  p.bySuit = bySuit
  p.getPluralStr = getPluralStr;
  return p;
})();

},{}],6:[function(require,module,exports){
var U = {
  c: function(x) { return function() { return U.clone(x) } },

  nop: function() {},

  clone: function(obj) {
    if (obj == undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
  },

  range: function(x, y) {
    if (y == undefined) {
      y = x;
      x = 0;
    }
    var ret = [];
    for (var i = x; i < y; i += 1) {
      ret.push(i);
    }
    return ret;
  },

  flatten: function(matr) {
    var ret = [];
    matr.forEach(function(ar) { ret = ret.concat(ar) });
    return ret;
  },

  unique: function(ar) {
    var ret = true;
    ar.forEach(function(x, i) { ret = ret && ar.indexOf(x, i + 1) != -1 });
    return ret;
  },

  subset: function(a, b) {
    var ret = true;
    a.forEach(function(x) { ret = ret && b.indexOf(a) != -1 });
  },

  subtr: function(a, b) {
    var ret = [];
    a.forEach(function(x) { if (b.indexOf(x) == -1) ret.push(x) });
    return ret;
  },

  mconcat: function(a, b) {
    var n = Math.min(a.length, b.length), ret = [];
    for (var i = 0; i < n; i += 1) ret.push(a[i].concat(b[i]));
    return ret;
  },

  all: function(a) {
    var ret = true;
    a.forEach(function(x) { ret = ret && x; });
    return ret;
  }
};

module.exports = U;

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


},{}]},{},[4])