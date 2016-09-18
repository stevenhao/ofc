var p = require('./poker');
var U = require('./utils');
module.exports = (function() {
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

  var pp = {};
  pp.scorePineapple = scorePineapple;
  pp.topBonus = topBonus;
  pp.midBonus = midBonus;
  pp.botBonus = botBonus;
  pp.noBonus = {name: 'nobonus', royalty: 0, fl: false};
  pp.getBonus = function(hand, idx, wasFL) {
    return [topBonus, midBonus, botBonus][idx](hand, wasFL);
  }
  pp.fouled = function(board) {
    console.log('checking foul', board);
    var ph = p.getPokerHand;
    console.log('hands:', ph(board[0]), ph(board[1]), ph(board[2]));
    return !legal(ph(board[0]), ph(board[1]), ph(board[2]));
  };
  pp.matchup = function(here, there) {
    var ph = p.getPokerHand;
    var gt = p.betterPokerHand;
    return U.range(3).map(function(i) {
      var a = ph(here[i]), b = ph(there[i]);
      return gt(a, b) ? 1 : (gt(b, a) ? -1 : 0);
    });
  };

  function fillSuit(s) {
    if (s.length == 1) {
      s += 's';
    }
    return s;
  }

  pp.ss = function(s) {
    return p.getPokerHand(s.split(' ').map(fillSuit));
  };
  return pp;
})();
