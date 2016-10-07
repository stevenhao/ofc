#include "json/src/json.hpp"

#define d(x) cout << "DBG: " << x << "\n"
using namespace nlohmann;

row j2r(json j) {
  vector<string> v = j.get<vector<string>>();
  vector<card> ret;
  for (auto i: v) {
    ret.push_back(_card(i));
  }
  return ret;
}

board j2b(json j) {
  vector<row> ret;
  for (json i: j) {
    row r = j2r(i);
    ret.push_back(r);
  }
  return ret;
}

play j2p(json j) {
  vector<int> v = j.get<vector<int>>();
  for(int i = 0; i < v.size(); ++i) {
    v[i]++;
  }
  return v;
}

json p2j(play p) {
  json ret;
  for(int r: p) {
    ret.push_back(r - 1);
  }
  return ret;
}

json b2j(batch_trial_result t) {
  json response;
  response["trials"] = t.trials;
  response["scoresq"] = t.scoresq;
  response["score"] = t.score;
  response["rph"] = t.rph;
  response["fl"] = t.fl;
  response["foul"] = t.foul;
  response["matchup"] = t.matchup;
  return response;
}
