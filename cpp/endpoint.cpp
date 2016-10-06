#include <iostream>
#include "./brain2.cpp"
#include "./jsonutil.cpp"

using namespace nlohmann;
using namespace std;

#define d(x) cout << "DBG: " << x << "\n"
#define err(x) cout << "ERR: " << x << "\n"
#define d2(x) cout << "DBG: " << x << " " << y << "\n"
#define p(x) cout << "DBG: " << #x << " is " << (x) << "\n"

json doGetMoves(json state) {
   // eg [ {play: [-1, 0, 1]}, {play: [-1, 1, 1]}, {play: [0, 0, -1]}, ]
  json response;
  d("doGetMoves1");
  board b = j2b(state["board"]);
  d("doGetMoves1");
  vector<card> pull = j2r(state["pull"]);
  d("doGetMoves1");
  vector<card> discard = j2r(state["discard"]);
  d("doGetMoves1");

  d("doGetMoves2");
  vector<play> plays = allPlays(b, pull, 1);
  if (plays.size() > 10) {
    plays.erase(plays.begin() + 10, plays.end());
  }

  d("doGetMoves1");
  for (play p: plays) {
    json obj;
    obj["play"] = p2j(p);
    response.push_back(obj);
  }

  d("doGetMoves2");
  return response;
}

json doEvaluate(json state, json move, int seed) {
   // eg [ {play: [-1, 0, 1]}, {play: [-1, 1, 1]}, {play: [0, 0, -1]}, ]
  json response;
  board b = j2b(state["board"]);
  vector<card> used;
  vector<card> pull = j2r(state["pull"]);
  trial_result trial = run_trial1(b, used, seed);
  trial.trials = 1;

  response = t2j(trial);
  return response;
}


bool doQuery() {
  json query, response;
  string line;
  d(line);
  getline(cin, line);
  try {
    query = json::parse(line);
  } catch(invalid_argument ex) {
     err("parse error[" + line << "]\n");
    return true;
  }

  string name = (string)(query["name"]).get<string>();
  json params = query["params"];
  p(name);
  if (name == "getMoves") {
    response["result"] = doGetMoves(params["state"]);
  } else if (name == "evaluate") {
    response["result"] = doEvaluate(params["state"], params["move"], params["seed"]);
  } else {
    response["result"] = 10;
  }
  response["id"] = query["id"];
  cout << response << "\n";
  cout.flush();
  return true;
}

int main() {
  generateFive();
  generateThree();
  while (true) {
    try {
      doQuery();
    } catch(...) {
      err("unknown error, not exiting\n");
    }
  }
}
