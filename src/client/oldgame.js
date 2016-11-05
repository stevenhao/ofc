var Poker = require('../share/poker');
var Board = require('./Board');
var Card = require('./card');
var Actions = require('./Actions');
var U = require('../share/utils');

var Game = {
  rowSizes: [3, 5, 5],
  viewmodel: function(ppp) {
    this.init = function() {
      this.pull = ppp.pull;
      this.pending = [[], [], []];
      this.used = [];
      this.idx = 2;
      this.moveIdx(0, -1);
      this.sortBy = 'byRank';
    };

    this.setIdx = function(idx) { this.idx = idx; };

    this.moveIdx = function(dir1, dir2) {
      var j = (this.idx + dir1 + 3) % 3;
      for(var i = 0; i < 2; i += 1, j = (j + dir2 + 3) % 3) {
        if (this.pending[j].length + ppp.board[j].length < Game.rowSizes[j]) break;
      }
      this.idx = j;
    };

    this.use = function(card) {
      this.pending[this.idx].push(card);
      this.used.push(card);
      this.moveIdx(0, -1);
    };

    this.unuse = function(card) {
      var idx = -1;
      this.pending.forEach(function(row, i) {
        if (row.indexOf(card) != -1) {
          row.remove(card);
          idx = i;
        }
      });
      this.used.remove(card);
      this.setIdx(idx);
    };

    this.sort = function() {
      this.sortBy = this.sortBy == 'byRank' ? 'bySuit' : 'byRank';
      this.pull.sort(Poker[this.sortBy]);
    };

    this.done = function() { return this.used.length + ppp.toDiscard == this.pull.length; };

    this.init();
  },

  controller: function(args) {
    var oncommit = args.oncommit || function() {};
    var onpull = args.onpull || function() {};
    this.brain = args.brain;
    this.vm = new Game.viewmodel(args.perspective);
    this.help = function() {
      if (!this.brain) return;
      var vm = this.vm;
      vm.used.slice().forEach(vm.unuse.bind(vm));
      var play = this.brain(args.perspective);
      play.forEach(function(row, i) {
        vm.idx = i;
        row.forEach(function(card) {
          vm.use(card);
        });
      });
    };
    this.commit = function() { oncommit(this.vm.pending); };
    this.sort = function() { this.vm.sort(); }
    this.pull = function() { onpull(); };
  },

  view: function(ctrl, args) {
    var ppp = args.perspective;
    var vm = ctrl.vm;
    var me = ppp.me;
    var opps = U.clone(ppp.boards); opps.splice(me, 1);
    var royalties = ppp.royalties || ppp.players.map(U.c([null, null, null]));
    console.log('game view', JSON.stringify(ppp));
    var fouled = (ppp.fouled) || ppp.players.map(U.c(false));
    console.log('foulde', fouled);
    var pending = (vm.pending) || [[],[],[]];
    return m('.game', [

      m('.there', opps.map(function(board, _p) {
        var p = _p + (_p >= me);
        return Board({
          board: board,
          active: ppp.turn == p,
          over: ppp.over,
          fouled: fouled[p],
          royalties: royalties[p],
        });
      })),

      m('.here', [
        Board({
          board: ppp.board,
          active: ppp.turn == me,
          pending: pending,
          over: ppp.over,
          fouled: fouled[me],
          royalties: royalties[me],
          selected: ppp.turn == me && vm.pull && vm.idx,
          onclickrow: vm.setIdx.bind(vm),
          onclickcard: vm.unuse.bind(vm),
        }),

        Actions({
          pull: U.clone(vm.pull),
          used: U.clone(vm.used),

          canpull: ppp.turn == me && !vm.pull,
          cansort: 1 && vm.pull,
          cancommit: vm.pull && vm.done(),
          canhelp: vm.pull && ctrl.brain,

          onuse: vm.use.bind(vm),
          onsort: ctrl.sort.bind(ctrl),
          oncommit: ctrl.commit.bind(ctrl),
          onhelp: ctrl.help.bind(ctrl),
          onpull: ctrl.pull.bind(ctrl),
        }),

        m('.discarded', ppp.discarded.map(function(card) {
          return Card(card);
        })),
      ]),
    ])
  },
};

module.exports = Game;
