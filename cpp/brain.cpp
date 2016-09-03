#include "pineapple.cpp"

double FL_BONUS = 10;
double FOUL_PENALTY = 5;
int ppcnt(int x) {
  int ret = 0;
  while (x) {
    ++ret;
    x -= x & -x;
  }
  return ret;
}

row take(vector<card> &v, int &msk) {
  row ret;
  for(int i = 0; i < v.size(); ++i) {
    if (msk & (1 << i)) {
      ret.push_back(v[i]);
    }
  }
  return ret;
}

double scoreComplete(hand top, hand mid, hand bot) {
  if (top > mid || mid > bot) {
    return -FOUL_PENALTY;
  }
  double sum = royalty(0, top) + royalty(1, mid) + royalty(2, bot);
  if (isFL(top)) {
    sum += FL_BONUS;
  }
  return sum;
}

double scoreComplete(row top, row mid, row bot) {
  return scoreComplete(_hand(top), _hand(mid), _hand(bot));
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

double scoreOptimistic(row top, row mid, row bot, row &pull) {
  // top, mid, bot are partially completed
  // the pull is enough cards to finish the game.
  vector<pair<hand, int> > A = go(top, pull, 3);
  vector<pair<hand, int> > B = go(mid, pull, 5);
  vector<pair<hand, int> > C = go(bot, pull, 5);

  double ans = -FOUL_PENALTY;
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
        double val = scoreComplete(top, mid, bot);
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
      double val = scoreComplete(empty, mid, bot);
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
    double val = scoreComplete(empty, empty, bot);
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

  if (ans < 0) {
    for (auto a: A) {
      if (ans >= 0) break;
      for (auto b: beats(a.first, B)) {
        if (ans >= 0) break;
        for (auto c: beats(b.first, C)) {
          ans = 0;
          break;
        }
      }
    }
  }
  return ans;
}

double evaluate1(board &B, vector<card> &used, int seed) {
  row top = B[0], mid = B[1], bot = B[2];
  int T = 8;
  int rem = 13 - top.size() - mid.size() - bot.size();
  int pullSize = rem + (rem + 2) / 3; // 2 -> 3, 4 -> 6, 6 -> 8, 8 -> 11
  double sum = 0;
  srand(seed);
  //cout << "used: "; disp(used, "\n");
  for(int t = 0; t < T; ++t) {
    row r = deck();
    for (card c: used) {
      r.erase(find(r.begin(), r.end(), c));
    }

    //cout << "pulling from deck of size " << r.size() << "\n";
    row pull = row(r.begin(), r.begin() + pullSize);
    double s = scoreOptimistic(top, mid, bot, pull);
    sum += s;
  }
  return sum / T;
}

typedef vector<int> play;
void apply(board &B, play &p, vector<card> &pull) {
  for (int i = 0; i < pull.size(); ++i) {
    if (p[i]) {
      B[p[i] - 1].push_back(pull[i]);
    }
  }
}

void disp(board B, play p, vector<card> &pull, string sep1, string sep2) {
  apply(B, p, pull);
  disp(B, sep1, sep2);
}

double scorePlay(play &p, board B, vector<card> &used, row &pull, int seed) {
  apply(B, p, pull);
  return evaluate1(B, used, seed);
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

vector<pair<double, play> > bestKMoves(int k, board B, vector<card> &used, vector<card> pull, int toDiscard, int time=10) {
  vector<play> all = allPlays(B, pull, toDiscard);
  int n = all.size();
  vector<pair<double, play> > scores(n);
  for (int i = 0; i < n; ++i) {
    scores[i].second = all[i];
  }

  int it = 0;
  int freq = max(1, int(time / 3));
  while (it < time) {
    for(int i = 0; i < scores.size(); ++i) {
      scores[i].first += scorePlay(scores[i].second, B, used, pull, it);
    }
    sort(scores.begin(), scores.end());
    int drop = 0;
    if (it % freq == 0 && scores.size() > 2 * k) {
      drop = max(0, int(1 + scores.size() - 1.5 * k) / 2);
    } else if (it % (2 * freq) == 0) {
      drop = max(0, int(scores.size() - k) / 3);
    }

    scores.erase(scores.begin(), scores.begin() + drop);
    ++it;
  }
  if (scores.size() > k) scores.erase(scores.begin(), scores.end() - k);

  for(auto &p: scores) {
    p.first /= it;
  }
  return scores;
}

pair<double, play> bestMoveFast(board B, vector<card> &used, vector<card> pull) {
  return bestKMoves(1, B, used, pull, pull.size() == 3 ? 1 : 0, 3).back();
}

// cannot call on empty or full board
double evaluate2(board &B, vector<card> &used, int seed, bool verbose=false) {
  row top = B[0], mid = B[1], bot = B[2];
  int rem = 13 - top.size() - mid.size() - bot.size();
  if (rem == 0) {
    return evaluate1(B, used, seed);
  }
  //cout << "evaluate2 "; disp(B, ",", " "); cout << "s(" << seed << ")\n";
  double sum = 0;
  double T = 5;
  for(int t = 0; t < T; ++t) {
    row r = usedDeck(used, T * seed + t);

    board curB = B;
    vector<card> curUsed = used;
    double score = 0;
    while (sz(curB) < 13) {
      int pullsize = sz(curB) == 0 ? 5 : 3;
      row pull = row(r.begin(), r.begin() + pullsize);
      r.erase(r.begin(), r.begin() + pullsize);
      curUsed.insert(curUsed.end(), pull.begin(), pull.end());
      pair<double, play> pp = bestMoveFast(curB, curUsed, pull);
      apply(curB, pp.second, pull);
      int otherSize = curUsed.size() == 5 ? 5 : 2;
      //otherSize *= 2;
      curUsed.insert(curUsed.end(), r.end() - otherSize, r.end());
      r.erase(r.end() - otherSize, r.end());
      score = pp.first;
    }
    if (verbose) {
      cout << "ended at "; disp(curB, ",", " "); cout << " " << score << "\n";
    }
    sum += score;
  }
  return sum / T;
}

double scorePlay2(play &p, board B, vector<card> &used, row &pull, int seed, bool verb) {
  apply(B, p, pull);
  return evaluate2(B, used, seed, verb);
}

vector<pair<double, play> > bestKMoves2(int k, int k2, board B, vector<card> &used, vector<card> pull, int time, bool dbg=true) {
  if (dbg) {
    cout << "Taking approximate best " << k2 << " moves.\n";
  }
  vector<pair<double, play> > scores = bestKMoves(k2, B, used, pull, pull.size() == 3 ? 1 : 0);
  int n = scores.size();
  for (int i = 0; i < n; ++i) {
    scores[i].first = 0;
  }

  int it = 0;
  int freq = max(1, time / 4);
  while (it < time)  {
    bool prnt = dbg && (it + 1) % (time / 5) == 0;
    if (prnt) {
      cout << "Trying " << scores.size() << " moves.\n";
    }
    for(int i = 0; i < scores.size(); ++i) {
      bool verb = i + 1 == scores.size() && prnt;
      scores[i].first += scorePlay2(scores[i].second, B, used, pull, it, verb);
    }
    sort(scores.begin(), scores.end());
    int drop = 0;
    if (it % freq == 0 && scores.size() > 2 * k) {
      drop = max(0, int((scores.size() - k) / 3));
    } else if (it % (2 * freq) == 0) {
      drop = max(0, int(scores.size() - k) / 3);
    }
    if (dbg && drop)
      cout << "dropping " << drop << ", now " << scores.size() - drop << "\n";
    scores.erase(scores.begin(), scores.begin() + drop);
    ++it;
    if (prnt) {
      cout << "current best: " << scores.back().first / it << " "; disp(B, scores.back().second, pull, ", ", " "); cout << "ahead by " << (scores.back().first - scores[scores.size() - 2].first) / it << "\n";
    }
  }
  if (scores.size() > k) scores.erase(scores.begin(), scores.end() - k);

  for(auto &p: scores) {
    p.first /= it;
  }
  //cout << "exit bestKMoves2\n";
  return scores;
}
