#include "json/src/json.hpp"

#define d(x) cout << "DBG: " << x << "\n"
using namespace nlohmann;
row j2r(json j) {
  d("j2r 1");
  vector<string> v = j.get<vector<string>>();
  d("j2r 2");
  vector<card> ret;
  d("j2r 3");
  for (auto i: v) {
    ret.push_back(_card(i));
  }
  d("j2r 4");
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
json p2j(play p) {
  json ret;
  for(int r: p) {
    ret.push_back(r - 1);
  }
  return ret;
}

json t2j(trial_result t) {
  json response;
  response["trials"] = t.trials;
  response["rph"] = t.rph;
  response["fl"] = t.fl;
  response["foul"] = t.foul;
  response["matchup"] = t.matchup;
  response["score"] = t.score;
  response["scoresq"] = t.scoresq;
  return response;
}
