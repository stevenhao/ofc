#include "pineapple.cpp"

const double fl_bonus = 10;

struct trial_result {
  double score; // = matchup + rph + fl * fl_bonus
  double rph;
  double foul; // 0 or 1
  double fl; // 0 or 1
  double matchup; // -6...6

  bool operator< (trial_result const &o) const {
    return score < o.score;
  }
  bool operator<= (trial_result const &o) const {
    return score <= o.score;
  }
  bool operator>= (trial_result const &o) const {
    return score >= o.score;
  }
  bool operator> (trial_result const &o) const {
    return score > o.score;
  }
};

vector<pair<hand, int> > go(row &r, vector<card> &v, int len);
vector<pair<hand, int> > beats(hand h, vector<pair<hand, int> > &v);
trial_result const FOUL = {-3, 0, 1, 0, -3};
trial_result const ZERO = {0, 0, 0, 0, 0};

trial_result scoreRows(hand top, hand mid, hand bot) {
  if (top > mid || mid > bot) { return FOUL; }

  double rph = royalty(0, top) + royalty(1, mid) + royalty(2, bot);
  double matchup = 1; // idk for now
  double fl = isFL(top) ? 1 : 0;
  return { matchup + rph + fl * fl_bonus, rph, 0, fl, matchup };
}

trial_result run_trial0(row top, row mid, row bot) {
  return scoreRows(_hand(top), _hand(mid), _hand(bot));
}

/*
 * B must be complete
 */
trial_result run_trial0(board B) {
  row top = B[0], mid = B[1], bot = B[2];
  return run_trial0(top, mid, bot);
}

/*
 * Naive -- assumes perfect vision (you can see all your future pulls)
 */
trial_result run_trial1(board _B, vector<card> used, int seed) {
  row top = _B[0], mid = _B[1], bot = _B[2];
  int rem = 13 - top.size() - mid.size() - bot.size();
  if (rem == 0) {
    return run_trial0(_B);
  }
  int pullSize = (13 - rem) * 3 / 2;
  vector<card> r = usedDeck(used, seed);
  row pull = row(r.begin(), r.begin() + pullSize);
  vector<pair<hand, int> > A = go(top, pull, 3);
  vector<pair<hand, int> > B = go(mid, pull, 5);
  vector<pair<hand, int> > C = go(bot, pull, 5);

  trial_result ans = FOUL;
  // pending optimizations
  // currently, worst case runtime 2^n * (n C 3 * (n-3) C 5)
  // for n = 10, this is ~ 1 million
  // it shoud be much less in practice (due to partially filled rows)

  hand empty = hand(HIGH_CARD, 0);
  hand sixes = hand(PAIR, 6);
  for (auto a: beats(sixes, A)) {
    hand top = a.first;
    for (auto b: beats(top, B)) {
      hand mid = b.first;
      if (a.second & b.second) continue;
      for (auto c: beats(mid, C)) {
        hand bot = c.first;
        if ((a.second | b.second) & c.second) continue;
        trial_result val = scoreRows(top, mid, bot);
        if (val > ans) {
          ans = val;
        }
      }
    }
  }

  hand trips = hand(THREE_OF_A_KIND, 0);
  for (auto b: beats(trips, B)) {
    hand mid = b.first;
    for (auto c: beats(mid, C)) {
      hand bot = c.first;
      trial_result val = scoreRows(empty, mid, bot);
      if (val <= ans) continue;
      for (auto a: A) {
        if ((b.second | c.second) & a.second) continue;
        ans = val;
        break;
      }
    }
  }

  hand straight = hand(STRAIGHT, 0);
  for (auto c: beats(straight, C)) {
    hand bot = c.first;
    trial_result val = scoreRows(empty, empty, bot);
    for (auto b: B) {
      hand mid = b.first;
      if (val <= ans) break;
      if (b.second & c.second) continue;
      if (mid > bot) continue;
      for (auto a: A) {
        if ((c.second | b.second) & a.second) continue;
        if (a.first > mid) continue;
        if (val <= ans) break;
        ans = val;
      }
    }
  }

  if (ans < ZERO) {
    for (auto a: A) {
      if (ans >= ZERO) break;
      for (auto b: beats(a.first, B)) {
        if (ans >= ZERO) break;
        for (auto c: beats(b.first, C)) {
          ans = ZERO;
          break;
        }
      }
    }
  }
  return ans;
}

/*
 * Realistic -- plays pulls one by one.
 * Calls run_trial1 multiple times to decide best move per pull
 */
trial_result run_trial2(board B, vector<card> used, int seed) {
  row top = B[0], mid = B[1], bot = B[2];
  int rem = 13 - top.size() - mid.size() - bot.size();
  if (rem == 0) {
    return run_trial0(B);
  }

  trial_result sum = ZERO;
  row r = usedDeck(used, seed); // seed determines the rest of the deck


  return sum;
}

int ppcnt(int x) {
  int ret = 0;
  while (x) {
    ++ret;
    x -= x & -x;
  }
  return ret;
}

vector<pair<hand, int> > beats(hand h, vector<pair<hand, int> > &v) {
  auto it = lower_bound(v.begin(), v.end(), pair<hand,int>(h, 0));
  return vector<pair<hand, int> >(it, v.end());
}

vector<vector<vector<pair<int, vector<int> > > > > chs;

vector<pair<hand, int> > go(row &r, vector<card> &v, int len) {
  int n = v.size();
  int p = len - r.size();
  while (chs.size() <= n) {
    int k = chs.size();
    vector<vector<pair<int, vector<int> > > > cur(k + 1);
    for(int i = 0; i < (1 << k); ++i) {
      vector<int> elts;
      for (int j = 0; j < k; ++j) {
        if (i & (1 << j)) {
          elts.push_back(j);
        }
      }
      cur[ppcnt(i)].push_back(pair<int, vector<int> >(i, elts));
    }
    chs.push_back(cur);
  }

  vector<pair<hand, int> > ret;
  row rr(len);
  int rs = r.size();
  for (int i = 0; i < rs; ++i) {
    rr[i] = r[i];
  }
  for(auto &sbset: chs[n][p]) {
    int idx = rs;
    for(int i: sbset.second) {
      rr[idx] = v[i];
      ++idx;
    }
    hand h = _hand(rr);
    ret.push_back(pair<hand, int>(h, sbset.first));
  }
  sort(ret.begin(), ret.end());
  return ret;
}

typedef vector<int> play;
void apply(board &B, play &p, vector<card> &pull) {
  for (int i = 0; i < pull.size(); ++i) {
    if (p[i]) {
      B[p[i] - 1].push_back(pull[i]);
    }
  }
}

vector<play> allPlays(board B, vector<card> pull, int toDiscard) {
  int n = pull.size();
  vector<play> ret;
  for(int x = 0; x < 1 << (2 * n); ++x) {
    play p;
    int a = B[0].size(), b = B[1].size(), c = B[2].size();
    int discard = 0;
    for(int i = 0; i < n; ++i) {
      int r = (x >> (2 * i)) & 3;
      if (r == 0) {
        ++discard;
      } else if (r == 1) {
        ++a;
      } else if (r == 2) {
        ++b;
      } else if (r == 3) {
        ++c;
      }
      p.push_back(r);
    }
    if (a <= 3 && b <= 5 && c <= 5 && discard == toDiscard) {
      ret.push_back(p);
    }
  }
  return ret;
}

