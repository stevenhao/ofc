#include "brain2.cpp"
#include "json/src/json.hpp"
#include <iostream>

using namespace nlohmann;
using namespace std;

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

bool doQuery() {
  json query, response;
  string line;
  getline(cin, line);
  cout << "parsing " << line << "\n";
  query = json::parse(line);
  response["id"] = query["id"];
  response["result"] = 10;
  cout << response << "\n";
  cout.flush();
  return true;
}


int main() {
  generateFive();
  generateThree();
  while (doQuery()) {
  }
}
