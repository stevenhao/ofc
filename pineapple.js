(function() {
  if (!p.getPokerHand) {
    console.err("poker.js not included. pineapple.js will not run.");
    return;
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
  }
  function botBonus(hand) {
  }

  function legal(top_, mid, bot) {
    return p.betterPokerHand(bot, mid) && p.betterPokerHand(mid, top_);
  }

  function scorePineapple(top_, mid, bot) {
    if (legal(top_, mid, bot)) {
    } else {
      return 0;
    }
  }
});
