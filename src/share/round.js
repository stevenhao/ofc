var U = require('./utils');
var P = require('./poker');
var Q = require('./pineapple');

module.exports = (function() {
  var c = U.c;

  var pullSizes = [5, 3, 3, 3, 3];
  var discardSizes = [0, 1, 1, 1, 1];
  var rowSizes = [3, 5, 5];
  var Round = function(players, fl) {
    this.players = players || ['A', 'B'];
    this.fl = fl || players.map(c(false));
    this.fldone = players.map(c(false));
    this.flpull = this.fl.map(function(fl) {
      if (fl) { return this.deck.splice(0, 14); }
    });
    this.turn = 0;
    this.pulled = false;
    this.pull = null;
    this.deck = P.makeDeck();
    this.street = 0;
    this.boards = players.map(c([[], [], []]));
    this.discarded = players.map(c([]));

    this.over = function() {
      return this.street == 5 && U.all(players.map(function(player, p) {
        return this.fldone[p] || !this.fl[p];
      }.bind(this)));
    };

    this.getPull = function() {
      if (this.over() || this.pulled) return;
      this.pulled = true;
      this.pull = this.deck.splice(0, pullSizes[this.street]);
    };

    this.apply = function(player, pending) {
      var p = this.players.indexOf(player);
      if (this.fl[p]) {
        this.fldone[p] = true;
        this.boards[p] = pending;
        return;
      }
      if (this.turn != p) return;
      if (!this.pulled) return;
      var pull = this.pull, play = U.flatten(pending), disc = U.subtr(this.pull, play);
      var board = this.boards[this.turn];
      if (play.length + disc.length == pull.length &&
          disc.length == discardSizes[this.street]) {
        var nboard = U.mconcat(board, pending);
        if (U.all(U.range(3).map(function(i) { return nboard[i].length <= rowSizes[i] }))) {
          this.discarded[this.turn] = this.discarded[this.turn].concat(disc);
          this.boards[this.turn] = nboard;
          this.turn += 1, this.pulled = false, this.pull = null;

          while (this.turn < this.players.length && this.fl[this.turn]) { this.turn += 1; }
          if (this.turn == this.players.length) {
            this.turn = 0, this.street += 1;
            while (this.turn < this.players.length && this.fl[this.turn]) { this.turn += 1; }
          }
        }
      }
    };

    this.score = function() {
      if (!this.over()) return;
      var ret = {};
      var fl = this.fl;
      var boards = this.boards;
      ret.fouled = boards.map(Q.fouled);
      ret.royalties = boards.map(function(board, i) {
        return board.map(function(row, j) {
          return ret.fouled[i] ? Q.noBonus : Q.getBonus(P.getPokerHand(row), j, fl[i]);
        });
      });
      ret.matchups = boards.map(function(A) {
        return boards.map(function(B) {
          return Q.matchup(A, B);
        });
      });
      return ret;
    };

    this.getPerspective = function(player) {
      var p = players.indexOf(player);
      var q = 1 - p; // for now, just 2-player
      var ret = {};
      ret.players = U.clone(this.players);
      ret.me = p;
      ret.fl = U.clone(this.fl);
      ret.fldone = U.clone(this.fldone);
      ret.boards = U.clone(this.boards);
      ret.turn = this.turn;
      ret.active = this.turn == p;
      ret.fl = U.clone(this.fl[p]);
      ret.board = U.clone(this.boards[p]);
      ret.discarded = U.clone(this.discarded[p]);
      ret.pull = U.clone((this.turn == p && this.pull) || this.flpull[p]);
      ret.toDiscard = this.turn == p ? discardSizes[this.street] : 0;
      ret.over = this.over();
      if (ret.over) {
        var scores = this.score();
        ret.royalties = scores.royalties;
        ret.matchups = scores.matchups;
        ret.fouled = scores.fouled;
      }

      return ret;
    };
  }
  return Round;
})();
