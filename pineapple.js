(function() {
  if (!p.getPokerHand) {
    console.err("poker.js not included. pineapple.js will not run.");
    return;
  }

  function legal(hi, mid, lo) {
    return p.betterPokerHand(lo, mid) && p.betterPokerHand(mid, lo);
  }

  function scorePineapple(hi, mid, lo) {
    hi = p.getPokerHand(hi);
    mid = p.getPokerHand(mid);
    lo = p.getPokerHand(lo);

    if (legal(hi, mid, lo)) {
    } else {
      return 0;
    }
  }
});
