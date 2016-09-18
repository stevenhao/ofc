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
