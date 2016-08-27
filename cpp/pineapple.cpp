#include "poker.cpp"

typedef vector<card> row;
typedef vector<row> board;

inline int sz(board &b) {
  return b[0].size() + b[1].size() + b[2].size();
}

board _board(row a, row b, row c) {
  return board({a, b, c});
}

void disp(row r, string sep=" ") {
  string ranks = "..23456789TJQKA", suits = "CDHS";
  cout << "ROW(";
  for (card c: r) {
    cout << ranks[c.Rank] << char(tolower(suits[c.Suit])) << " ";
  }
  cout << ")" << sep;
}

void disp(board B, string sep=" ", string sep2 = "\n") {
  cout << "BOARD(";
  for (row r: B) {
    cout << sep2;
    disp(r, "");
  }
  cout << ")" << sep;
}

bool isFL(hand h) {
  return h >= hand(PAIR, 12);
}

int royalty(int rid, hand h) {
  int T = h.Tier, V = int(h.Tiebreak);

  if (rid == 0) {
    if (T == PAIR) {
      return max(0, V - 5);
    } else if (T == THREE_OF_A_KIND) {
      return V + 8;
    }
  } else {
    if (rid == 1 && T == THREE_OF_A_KIND) {
      return 2;
    }

    if (T < STRAIGHT) return 0;
    int multiplier = rid == 1 ? 2 : 1;
    if (T == STRAIGHT) {
      return 2 * multiplier;
    } else if (T == FLUSH) {
      return 4 * multiplier;
    } else if (T == FULL_HOUSE) {
      return 6 * multiplier;
    } else if (T == FOUR_OF_A_KIND) {
      return 10 * multiplier;
    } else if (T == STRAIGHT_FLUSH) {
      return 15 * multiplier;
    } else if (T == ROYAL_FLUSH) {
      return 25 * multiplier;
    }
  }
  return 0;
}
int royalties(board B) {
  hand a = _hand(B[0]), b = _hand(B[1]), c = _hand(B[2]);
  if (a > b || b > c) {
    return 0;
  } else {
    int sum = royalty(0, a) + royalty(1, b) + royalty(2, c);
    return sum;
  }
}

