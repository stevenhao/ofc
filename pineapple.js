(function() {
  if (!p.getPokerHand) {
    console.err("poker.js not included. pineapple.js will not run.");
    return;
  }

  var bonuses = {
    p.tiers.Straight: 2,
    p.tiers.Flush: 4,
    p.tiers.FullHouse: 6,
    p.tiers.FourOfAKind: 10,
    p.tiers.StraightFlush: 15,
    p.tiers.RoyalFlush: 25,
  }

  function topBonus(hand) {
    var ret = 0;
    var value = Math.floor(hand.score); // this gives the main part of the hand (0-th kicker)
    if (hand.tier == p.tiers.ThreeOfAKind) {
      return value + 8;
    } else if (hand.tier == p.tiers.Pair) {
      return Math.max(0, value - 5);
    } else {
      return 0;
    }
  }

  function midBonus(hand) {
    if (hand.tier in bonuses) {
      return bonuses[hand.tier] * 2;
    } else if (hand.tier == p.tiers.ThreeOfAKind) {
      return 2;
    } else {
      return 0;
    }
  }

  function botBonus(hand) {
    if (hand.tier in bonuses) {
      return bonuses[hand.tier];
    } else {
      return 0;
    }
  }

  function legal(top_, mid, bot) {
    return p.betterPokerHand(bot, mid) && p.betterPokerHand(mid, top_);
  }

  function scorePineapple(top_, mid, bot) {
    if (legal(top_, mid, bot)) {
      return topBonus(top_) + midBonus(mid) + botBonus(bot);
    } else {
      return 0;
    }
  }
});
