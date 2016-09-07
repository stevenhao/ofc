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
