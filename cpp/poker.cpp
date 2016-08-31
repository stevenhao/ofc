#include <vector>
#include <cstdlib>
#include <iostream>
#include <map>
#include <algorithm>
using namespace std;

#define HIGH_CARD 1
#define PAIR 2
#define TWO_PAIR 3
#define THREE_OF_A_KIND 4
#define STRAIGHT 5
#define FLUSH 6
#define FULL_HOUSE 7
#define FOUR_OF_A_KIND 8
#define STRAIGHT_FLUSH 9
#define ROYAL_FLUSH 10

typedef vector<int> vi;
// double precision is not an issue (53 bits ~ 15.95 > 10 digits)
typedef pair<int, double> hand;
#define Tier first
#define Tiebreak second
typedef pair<int, int> card;
#define Rank first
#define Suit second
int GLOBAL_SEED = 21;
vector<card> usedDeck(vector<card> used, int seed=-1) {
  int prv = rand();
  if (seed != -1) srand(seed + GLOBAL_SEED * 100000);
  vector<int> vis(20);
  for (card c: used) {
    vis[c.Rank] |= 1 << c.Suit;
  }
  vector<card> ret;
  for(int i = 2; i <= 14; ++i) {
    for(int j = 0; j < 4; ++j) {
      if (!(vis[i] & (1 << j))) {
        ret.push_back(card(i, j));
      }
    }
  }
  for(int i = 0; i < ret.size(); ++i) {
    int j = rand() % (i + 1);
    swap(ret[i], ret[j]);
  }
  srand(prv);
  return ret;
}

vector<card> deck(int seed=-1) {
  return usedDeck(vector<card>(), seed);
}

map<int, hand> table;
hand lookup(int hsh) {
  if (table.find(hsh) == table.end()) {
    cerr << "cannot find hand " << hsh << "\n";
    throw "gg";
  }
  return table[hsh];
}

void insert(int tier, vi ranks, vi kickers) {
  sort(ranks.begin(), ranks.end());
  int hsh = 0;
  for (int i: ranks) {
    hsh = hsh * 100 + i;
  }

  double tiebreak = 0, scale = 1;
  for (int i: kickers) {
    tiebreak += i * scale;
    scale *= 0.01;
  }
  hand h = hand(tier, tiebreak);
  if (h > table[hsh]) {
    table[hsh] = h;
  }
}

void generateFive() {
  vi ranks;
  for(int i = 2; i <= 14; ++i) {
    ranks.push_back(i);
  }

  for(int a: ranks) {
    for(int b: ranks) {
      if (a == b) continue;
      insert(FOUR_OF_A_KIND, vi({a, a, a, a, b}), vi({a, b}));
      insert(FULL_HOUSE, vi({a, a, a, b, b}), vi({a, b}));
      for(int c: ranks) {
        if (a == c || b <= c) continue;
        insert(THREE_OF_A_KIND, vi({a, a, a, b, c}), vi({a, b, c}));
        insert(TWO_PAIR, vi({a, b, b, c, c}), vi({b, c, a}));
        for(int d: ranks) {
          if (a == d || c <= d) continue;
          insert(PAIR, vi({a, a, b, c, d}), vi({a, b, c, d}));
          for(int e: ranks) {
            if (a <= b || d <= e) continue;
            insert(HIGH_CARD, vi({a, b, c, d, e}), vi({a, b, c, d, e}));
          }
        }
      }
    }
  }
  insert(STRAIGHT, vi({14, 2, 3, 4, 5}), vi({5}));
  for(int i = 5; i <= 14; ++i) {
    insert(STRAIGHT, vi({i==5 ? 14 : i-4, i-3, i-2, i-1, i}), vi({i}));
  }
}

void generateThree() {
  vi ranks;
  for(int i = 2; i <= 14; ++i) {
    ranks.push_back(i);
  }

  for(int a: ranks) {
    insert(THREE_OF_A_KIND, vi({a, a, a}), vi({a}));
    for(int b: ranks) {
      if (a == b) continue;
      insert(PAIR, vi({a, a, b}), vi({a, b}));
      for(int c: ranks) {
        if (a <= b || b <= c) continue;
        insert(HIGH_CARD, vi({a, b, c}), vi({a, b, c}));
      }
    }
  }
}


hand _hand(vector<card> cards) {
  bool is_flush = cards.size() == 5;
  int hsh = 0;
  sort(cards.begin(), cards.end());
  vi ranks;
  for (auto c: cards) {
    hsh = hsh * 100 + c.Rank;
    is_flush = is_flush && c.Suit == cards[0].Suit;
  }

  hand h = lookup(hsh);
  if (is_flush) {
    if (h.Tier == STRAIGHT) {
      if (int(h.Tiebreak) == 14) {
        return hand(ROYAL_FLUSH, h.Tiebreak);
      } else {
        return hand(STRAIGHT_FLUSH, h.Tiebreak);
      }
    } else {
      return hand(FLUSH, h.Tiebreak);
    }
  } else {
    return h;
  }
}


card _card(string cardstr) {
  if (cardstr.length() != 2) {
    cerr << "invalid cardstr (length != 2) " << cardstr << "\n";
    throw "gg";
  }
  string ranks = "..23456789TJQKA", suits = "CDHS";
  int rank = ranks.find(toupper(cardstr[0])), suit = suits.find(toupper(cardstr[1]));
  if (rank == -1 || suit == -1) {
    cerr << "invalid cardstr (chars not found) " << cardstr << "\n";
    throw "gg";
  }
  return card(rank, suit);
}

vector<card> _cards(string handstr) {
  vector<card> cards;
  string cur = "";
  for(int i = 0; i < handstr.size(); ++i) {
    if (handstr[i] == ' ') {
      cur = "";
    } else {
      cur += handstr.substr(i, 1);
    }

    if (i + 1 == handstr.size() || handstr[i + 1] == ' ') {
      if (cur.size()) {
        cards.push_back(_card(cur));
      }
    }
  }
  return cards;
}

hand _hand(string handstr) {
  return _hand(_cards(handstr));
}
