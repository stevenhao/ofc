#include <iostream>
#include "./brain2.cpp"
#include "./jsonutil.cpp"
#include "./dbg.cpp"

using namespace nlohmann;
using namespace std;
json doGetMoves(json state, int seed) {
   // eg [ {play: [-1, 0, 1]}, {play: [-1, 1, 1]}, {play: [0, 0, -1]}, ]
  json response;
  board b = j2b(state["board"]);
  vector<card> pull = j2r(state["pull"]);
  vector<card> discard = j2r(state["discard"]);
  board ob = j2b(state["oboard"]);
  vector<card> used = b[0] + b[1] + b[2] + ob[0] + ob[1] + ob[2] + pull + discard;
  int toDiscard = pull.size() == 5 ? 0 : 1;

  int K = 9;
  vector<play> plays = bestKPlays(K, b, pull, toDiscard, used, seed);

  for (play p: plays) {
    json obj;
    obj["play"] = p2j(p);
    response.push_back(obj);
  }

  return response;
}

json doEvaluate(json state, json move, int seed) {
  json response;
  vector<card> pull = j2r(state["pull"]);
  vector<card> discard = j2r(state["discard"]);
  vector<int> play = j2p(move);
  board b = j2b(state["board"]);
  board ob = j2b(state["oboard"]);
  vector<card> used = b[0] + b[1] + b[2] + ob[0] + ob[1] + ob[2] + pull + discard;

  board nb = apply(b, pull, play);

  batch_trial_result result;
  int bsize = sz(b);
  int trials = bsize == 0 ? 20 : (bsize == 5 ? 100 : 300);
  for(int i = 0; i < trials; ++i) {
    //trial_result trial = run_trial1(nb, used, seed * trials + i);
    trial_result trial = run_trial2(nb, used, seed * trials + i);
    result = result + trial;
  }

  response = b2j(result);
  return response;
}


bool doQuery() {
  if (!cin) return false;
  json query, response;
  string line;
  getline(cin, line);
  try {
    query = json::parse(line);
  } catch(invalid_argument ex) {
     err("parse error[" + line << "]\n");
    return true;
  }

  string name = (string)(query["name"]).get<string>();
  json params = query["params"];
  if (name == "getMoves") {
    response["result"] = doGetMoves(params["state"], params["seed"]);
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
      if (!doQuery()) {
        break;
      }
    } catch(...) {
      err("unknown error, not exiting\n");
    }
  }
}
