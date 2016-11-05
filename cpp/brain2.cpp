#include "pineapple.cpp"
#include "./dbg.cpp"

const double fl_bonus = 10;

typedef vector<int> play;
struct trial_result {
  double score;
  double rph;
  double matchup; // -6...6
  bool fl; // 0 or 1
  bool foul; // 0 or 1

  trial_result(double _rph, double _matchup, bool _fl=false, bool _foul=false) {
    score = _rph + _matchup + (_fl ? fl_bonus : 0);
    rph = _rph;
    matchup = _matchup;
    fl = _fl;
    foul = _foul;
  }
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

struct batch_trial_result {
  double scoresq;
  double score;
  double rph;
  double matchup;
  int trials;
  double fl;
  double foul;
  batch_trial_result() {
    scoresq = score = rph = matchup = trials = fl = foul = 0;
  }


  batch_trial_result operator+ (trial_result t) {
    trials += 1;
    scoresq += t.score * t.score;
    score += t.score;
    rph += t.rph;
    matchup += t.matchup;
    fl += t.fl;
    foul += t.foul;
    return *this;
  }
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
vector<play> allPlays(board B, vector<card> pull, int toDiscard);

board apply(board B, vector<card> pull, play p);

trial_result const FOUL(0, -3, false, true);
trial_result const ZERO(0, 0, false, false);

trial_result scoreRows(hand top, hand mid, hand bot) {
  if (top > mid || mid > bot) { return FOUL; }

  double rph = royalty(0, top) + royalty(1, mid) + royalty(2, bot);
  double matchup = 0;
  return trial_result(rph, matchup, isFL(top), false);
}

/*
 * B must be complete
 */
trial_result run_trial0(board B) {
  row top = B[0], mid = B[1], bot = B[2];
  return scoreRows(_hand(top), _hand(mid), _hand(bot));
}

/*
 * Naive -- assumes perfect vision (you can see all your future pulls)
 */
trial_result run_trial1(board _B, vector<card> &used, int seed) {
  row top = _B[0], mid = _B[1], bot = _B[2];
  int rem = 13 - top.size() - mid.size() - bot.size();
  if (rem == 0) {
    return run_trial0(_B);
  }

  int pullSize = rem;
  if (pullSize == 8) pullSize += 3;
  else if (pullSize == 6) pullSize += 2;
  else if (pullSize == 4) pullSize += 2;
  else if (pullSize == 2) pullSize += 1;

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
      if (b.second & c.second) continue;
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
        if (a.second & b.second) continue;
        if (ans >= ZERO) break;
        for (auto c: beats(b.first, C)) {
          if ((a.second | b.second) & c.second) continue;
          ans = ZERO;
          break;
        }
      }
    }
  }
  return ans;
}

play bestMoveFast(board B, vector<card> used, row pull) {
  vector<play> all = allPlays(B, pull, 1);
  vector<pair<double, pair<play, board>>> v;
  for (play p: all) {
    v.emplace_back(0, pair<play, board>(p, apply(B, pull, p)));
  }

  int its = 2;
  for(int i = 0; i < its; ++i) {
    for(int j = 0; j < v.size(); ++j) {
      trial_result trial = run_trial1(v[j].second.second, used, -1);
      v[j].first += -trial.score;
    }
  }

  sort(v.begin(), v.end());
  v.erase(v.begin() + 2, v.end());

  its = 3;
  for(int i = 0; i < its; ++i) {
    for(int j = 0; j < v.size(); ++j) {
      trial_result trial = run_trial1(v[j].second.second, used, -1);
      v[j].first += -trial.score;
    }
  }

  sort(v.begin(), v.end());
  return v.front().second.first;
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

  row r = usedDeck(used, 10 * seed); // seed determines the rest of the deck

  vector<card> curUsed = used;
  while (sz(B) < 13) {
    int pullsize = sz(B) == 0 ? 5 : 3;
    row pull = row(r.begin(), r.begin() + pullsize);
    r.erase(r.begin(), r.begin() + pullsize);
    curUsed.insert(curUsed.end(), pull.begin(), pull.end());
    play pp = bestMoveFast(B, curUsed, pull);
    B = apply(B, pull, pp);
    int otherSize = curUsed.size() == 5 ? 5 : 2;
    curUsed.insert(curUsed.end(), r.end() - otherSize, r.end());
    r.erase(r.end() - otherSize, r.end());
  }
  return run_trial0(B);
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

board apply(board B, vector<card> pull, play p) {
  for(int i = 0; i < p.size(); ++i) {
    int ridx = p[i] - 1;
    if (ridx != -1) {
      B[ridx].push_back(pull[i]);
    }
  }
  return B;
}

vector<play> bestKPlays(int K, board B, vector<card> pull, int toDiscard, vector<card> used, int seed) {
  vector<play> all = allPlays(B, pull, toDiscard);
  vector<pair<double, pair<play, board>>> v;
  for (play p: all) {
    v.emplace_back(0, pair<play, board>(p, apply(B, pull, p)));
  }

  if (v.size() >= 4 * K) {
    int its = 20 + 100 / v.size();
    for(int i = 0; i < its; ++i) {
      for(int j = 0; j < v.size(); ++j) {
        trial_result trial = run_trial1(v[j].second.second, used, seed++);
        v[j].first += -trial.score;
      }
    }

    sort(v.begin(), v.end());
    v.erase(v.begin() + 4 * K, v.end());
  }

  if (v.size() >= K) {
    int its = 60 + 100 / v.size();
    for(int i = 0; i < its; ++i) {
      for(int j = 0; j < v.size(); ++j) {
        trial_result trial = run_trial1(v[j].second.second, used, seed++);
        v[j].first += -trial.score;
      }
    }

    sort(v.begin(), v.end());
    v.erase(v.begin() + K, v.end());
  }

  vector<play> ret;
  for (auto i: v) {
    ret.push_back(i.second.first);
  }
  return ret;
}

