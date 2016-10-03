#include "brain2.cpp"
#include <iostream>

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

void doQuery() {
}



int main() {
  generateFive();
  generateThree();
  string x;
  while (cin >> x) {
    cout << "You said, " << x << "\n";
    cout.flush();
  }
}
