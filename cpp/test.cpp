#include "brain.cpp"
#include <iostream>

using namespace std;

void testPoker() {
  string s;
  getline(cin, s);
  hand h = _hand(s);
  cout << h.first << " " << h.second << "\n";
}

row readRow() {
  string s;
  getline(cin, s);
  row r = _cards(s);
  return r;
}

vector<row> readRows(int num) {
  string s;
  vector<row> rows;
  for(int i = 0; i < num; ++i) {
    rows.push_back(readRow());
  }
  return rows;
}

void testPineapple() {
  board B = readRows(3);
  cout << "TEST RESULT: " << royalties(B) << "\n";
}

void testBrain() {
  board B = readRows(3);
  row pull = readRows(1)[0];
  cout << "TEST INPUT: ";
  disp(B, "\n");
  cout << "PULL: "; disp(pull);
  cout << "\n\n";

  int ans = scoreOptimistic(B[0], B[1], B[2], pull);
  cout << "TEST RESULT: " << ans << "\n\n\n";
}

void testBrainSpeed() {
  int T = 100000;
  for(int t = 0; t < T; ++t) {
    vector<card> D = deck();
    int a = 1, b = 3, c = 3, d = 7;
    row T = row(D.begin(), D.begin() + a);
    row M = row(D.begin() + a, D.begin() + a + b);
    row B = row(D.begin() + a + b, D.begin() + a + b + c);
    row P = row(D.begin() + a + b + c, D.begin() + a + b + c + d);
    int ans = scoreOptimistic(T, M, B, P);
/*    cout << "TEST " << t << " INPUT: [";
    disp(T, ",");
    disp(M, ",");
    disp(B, ",");
    disp(P, ",");
    cout << "]\n";*/
    cout << "TEST " << t << " OUTPUT: " << ans << "\n";
  }
}

void simulateGame(bool button=true, int seed=-1) {
  cout << "simulating game.\n";
  board B = _board(row(), row(), row());
  vector<card> used, D = deck(seed);
  vector<card> discarded;
  while (sz(B) < 13) {
    int othsize = sz(B) ? 2 : 5;
    used.insert(used.end(), D.begin(), D.begin() + othsize);
    discarded.insert(discarded.end(), D.begin(), D.begin() + othsize);
    D.erase(D.begin(), D.begin() + othsize);

    int pullsize = sz(B) ? 3 : 5;
    used.insert(used.end(), D.begin(), D.begin() + pullsize);
    row pull = row(D.begin(), D.begin() + pullsize);
    D.erase(D.begin(), D.begin() + pullsize);

    //cout << "USED: "; disp(used, "\n");
    disp(B, "\n\n");
    cout << "PULL: "; disp(pull, "\n");
    cout << "DISCARDED: "; disp(discarded, "\n");
    //++GLOBAL_SEED;
    int k = 3, j = 15, time = 500;
    if (sz(B) == 7) {
      time = 60;
    }
    if (sz(B) == 5) {
      time = 20;
    }
    if (sz(B) == 0) {
      j = 35;
      time = 6;
    }
    int mult = 4;
    pair<double, play> p = bestKMoves2(k, j, B, used, pull, time * mult, false).back();
    apply(B, p.second, pull);
    cout << "score: " << p.first << "\n";
  }
  cout << "Ended at "; disp(B, "\n");
  cout << scoreComplete(B[0], B[1], B[2]) << "\n";
}

void testBrain2() {
  board B = readRows(3);

  row pull = readRow();
  row used = readRow();
  for (row r: B) {
    used.insert(used.end(), r.begin(), r.end());
  }
  used.insert(used.end(), pull.begin(), pull.end());
  cout << "TEST INPUT:\n";
  disp(B, "\n");
  cout << "pull = "; disp(pull, "\n");
  cout << "used = "; disp(used, "\n");

  cout << "\n";

  if (pull.size() == 0) {
    double sum = 0;
    double T = 10;
    for(int i = 0; i < T; ++i) {
      sum += evaluate2(B, used, i, true);
      if (i % 10 == 0) {
        cout << "After " << ((i+1) * 5) << ", " << sum / (i + 1) << "\n";
      }
    }
    cout << "TEST RESULT: (ran " << T * 5 << " trials)\n";
    cout << sum / T << "\n";
    return;
  }
  if (pull.size() >= 13) {
    FL_BONUS = 0;
    cout << "TEST RESULT: " << scoreOptimistic(row(), row(), row(), pull) << "\n";
    return;
  }
  int mult = 10;
  GLOBAL_SEED *= mult;

  //cout << "used: "; disp(used, "\n");
  int k = 3, j = 15, time = 500;
  if (sz(B) == 7) {
    time = 60;
  }
  if (sz(B) == 5) {
    time = 20;
  }
  if (sz(B) == 0) {
    j = 50;
    time = 6;
  }
  time *= mult;
  vector<pair<double, play> > plays = bestKMoves2(k, j, B, used, pull, time);
  cout << "TEST RESULT: (ran " << time * 5 << " trials)\n";
  for (int i = 0; i < plays.size(); ++i) {

    cout << "Play #" << (i+1) << ": " << plays[i].first << "\n";
    board result = B; apply(result, plays[i].second, pull);
    disp(result, "\n");
    cout << "\n";
  }
  cout << "\n\n\n";
}


int main() {
  GLOBAL_SEED = 10;
  generateFive();
  generateThree();
  /*for(int i = 1; i <= 100; ++i) {
    cout << "Simulation " << i << ":\n";
    simulateGame(true, i);
  }*/
  testBrain2();
}
