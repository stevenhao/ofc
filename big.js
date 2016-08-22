function nop() {}
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
/*
 * p.lookupTable: object with 6188 keys, mpas sorted-rank-strings to hands,
 * e.g. p.lookupTable['KK444'] = {name: 'Full House', tier: 6, kickerValue: 93}
 * p.getPokerHand: function that takes a list of card-strings and returns a hand,
 * e.g. p.getPokerHand(['As', 'Ks', 'Qs', 'Js', 'Ts']) == 
 *
 * */
(function() {
  p = {};
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
  function descendingRank(rnkA, rnkB) { return rankToNum(rnkB) - rankToNum(rnkA); }
  function getRank(card) { return card[0]; }
  function getSuit(card) { return card[1]; }
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
      var s = ranks.slice().sort(descendingRank).join('');
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
    r.sort(descendingRank);
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
      r.sort(descendingRank);
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

  p.getPokerHand = getPokerHand;
  p.betterPokerHand = betterPokerHand;
  p.getDeck = getDeck;
  p.getRank = getRank;
  p.getSuit = getSuit;
  p.numToRank = numToRank;
  p.rankToNum = rankToNum;
  p.getPluralStr = getPluralStr;
})();
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

  function topBonus(hand) {
    var ret = 0;
    var value = Math.floor(hand.kickerValue); // this gives the main part of the hand (0-th kicker)
    var rankName = p.getPluralStr(p.numToRank(value));
    if (hand.tier == p.tiers.ThreeOfAKind) {
      return {
        name: 'Three of a Kind ' + rankName,
        royalty: value + 8,
      }
    } else if (hand.tier == p.tiers.Pair && value >= 6) {
      return {
        name: rankName,
        royalty: Math.max(0, value - 5),
      }
    } else {
      return {
        name: hand.name,
        royalty: 0,
      };
    }
  }

  function midBonus(hand) {
    var royalty = 0;
    if (bonuses.has(hand.tier)) {
      royalty = bonuses.get(hand.tier) * 2;
    } else if (hand.tier == p.tiers.ThreeOfAKind) {
      royalty = 2;
    }

    return { name: hand.name, royalty: royalty, }
  }

  function botBonus(hand) {
    var royalty = 0;
    if (bonuses.has(hand.tier)) {
      royalty = bonuses.get(hand.tier);
    }

    return { name: hand.name, royalty: royalty, }
  }

  function legal(top_, mid, bot) {
    return p.betterPokerHand(bot, mid) && p.betterPokerHand(mid, top_);
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
(function() {
  b = {};
  function getBestPlay(cards) {
    // try everything?
    var mx = 0;
    var trace = null;
    function mskToCards(msk) {
       return cards.take(range(14).filter(function(i) {
          return msk & (1 << i);
       }));
    }

    function mskToHand(msk) {
      var cards = mskToCards(msk);
      return p.getPokerHand(cards);
    }

    function check(_top, mid, bot) {
      var score = p.scorePineapple(_top, mid, bot);
      if (score > mx) {
        mx = score;
        trace = {_top, mid, bot};
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

    console.log('getBestPlay: generating the guy!');
    // generate the guy!
    var steps = 0;
    var bots = 0;
    var n = 14;
    for (var a = (1 << n) - 1; a > 0; a = (a - 1)) {
      //if (steps > 1000) break;
      if (ppcnt(a) == 5) {
        var bot = mskToHand(a);
        if (bot.tier <= 1) continue; // skip High card and pair
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
                var _top = mskToHand(c);
                check(_top, mid, bot);
              }
            }
          }
        }
      }
    }
    console.log('total steps', {steps, bots});

    return {royalty: mx, play: trace}
  }


  b.runTrial = function() {
    var cards = p.getDeck().slice(0, 14);
    console.log('runTrial: generated cards', {cards});
    var bestPlay = b.getBestPlay(cards);
    console.log('runTrial: gotBestPlay: ', bestPlay);
    return bestPlay.royalty;
  }
  b.runTrials = function(n) {
    n = n || 100;
    var sum = 0;
    var cnt = 0;
    range(n).forEach(function(i) {
      console.log('running trial ', i);
      var outcm = b.runTrial();
      sum += outcm;
      cnt += 1;
      console.log('current average: ', sum / cnt);
    });
  }

  b.getBestPlay = getBestPlay;
})();
