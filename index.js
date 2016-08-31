'use strict';

var Game = {
  rowSizes: [3, 5, 5],
  viewmodel: function(args) {
    this.init = function() {
      this.board = args.board || [[], [], []];
      this.pull = args.pull || [];
      this.pull.sort(p.byRank);
      this.sortBy = 'byRank';
      this.need = args.need || this.pull.length - (this.pull.length == 5 ? 0 : 1);
      this.pending = args.pending || [[], [], []];
      this.used = args.used || [];
      this.idx = 2; this.moveIdx(0, -1);
    }

    this.done = function() { return this.used.length == this.need; };

    this.use = function(card) {
      this.pending[this.idx].push(card);
      this.used.push(card);
      this.moveIdx(0, -1);
    };

    this.unuse = function(card) {
      this.pending.forEach(function(row) {
        row.remove(card);
      });
      this.used.remove(card);
    };

    this.setIdx = function(idx) {
      this.idx = idx;
    };
    this.moveIdx = function(dir1, dir2) {
      var j = (this.idx + dir1 + 3) % 3;
      for(var i = 0; i < 2; i += 1) {
        if (this.pending[j].length + this.board[j].length < Game.rowSizes[j]) break;
        j = (j + dir2 + 3) % 3;
      }
      this.idx = j;
    };

    this.sort = function() {
      this.sortBy = this.sortBy == 'byRank' ? 'bySuit' : 'byRank';
      this.pull.sort(p[this.sortBy]);
    };

    this.init();
  },

  controller: function(args) {
    this.vm = m.prop(new Game.viewmodel(args));
  },

  view: function(ctrl, args) {
    var vm = ctrl.vm();
    return m('div', [

      m('.board', vm.board.map(function(row, i) {
        return m('.row', {className: vm.idx == i ? 'selected' : ''}, function() {
          var next = vm.idx == i && !vm.done();
          var z = 8, p = 8;
          var children = [];
          children = children.concat(row.map(function(card) {
            return m('.slot',
                {style: {'z-index': z--}}, d.draw(card));
          }));
          children = children.concat(vm.pending[i].map(function(card) {
            return m('.slot.pending.clicky', {
              style: {'z-index': (p++) + (z--)},
              onclick: vm.unuse.bind(vm, card),
            }, d.draw(card));
          }));
          children = children.concat(range((i==0 ? 3 : 5) - children.length).map(function() {
            return m('.slot.clicky', {
              style: {'z-index': z--}, onclick: vm.setIdx.bind(vm, i) ,
            }, d.draw());
          }));
          return children;
        }());
      })),

      m('.pull', (function(cards) {
        var r = 1; // split lots of cards into smaller rows
        while (cards.length / r > r * 2 + 5) r += 1; // at most 1x7, 2x9, 3x11, etc
        var idx = 0;
        return range(r).map(function(i) {
          var len = Math.floor((cards.length - idx) / (r - i));
          idx += len;
          return cards.slice(idx - len, idx);
        });
      })(vm.pull).map(function(row) {
        return m('.row', row.map(function(card, i) {
          if (vm.used.contains(card)) {
            return m('.slot.clicky', { onclick: vm.unuse.bind(vm, card) }, d.draw());
          } else {
            return m('.slot.clicky', {
              onclick: vm.use.bind(vm, card),
              config: function(el, init) {
                el.addEventListener('touchstart', function() {
                  console.log('touchstart');
                });
                el.addEventListener('touchmove', function(evt) {
                  console.log('touchmove');
                  evt.preventDefault();
                });
              },
            }, d.draw(card));
          }
        }));
      })),

      m('.buttons', function() {
        return [
          m('div.btn', { onclick: vm.sort.bind(vm) }, 'SORT'),
        ];
      }()),
    ])
  },
};

var FantasyLand = {
  controller: function(args) {
    this.cards = m.prop(p.getDeck().slice(0, args.len || 14));
  },
  view: function(ctrl, args) {
    return m('div', [
      m.component(Game, { pull: ctrl.cards() , discard: ctrl.cards().length - 13}),
    ]);
  },
};

var App = {
  controller: function() {
  },
  view: function(ctrl) {
    return m.component(FantasyLand, {len: 14});
  },
};


m.mount(document.getElementById('root'), App);

window.setCards = function(s) {
  ctrl.setCards(s.split(' '));
  m.redraw(true);
}
