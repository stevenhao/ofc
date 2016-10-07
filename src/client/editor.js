var U = require('../share/utils');
var Card = require('./card');

var CardEditor = {
  view: function(ctrl, args) {
    function checkCardstr(s) {
      if (s.length > 1) return s[0] + s.substr(1).toLowerCase();
      else return s;
    }
    args.oninput = args.oninput || U.nop;
    args.card = args.card || m.prop('');
    return m('.slot', [
      m('input', {
        value: args.card(),
        oninput: m.withAttr('value', U.chain(args.oninput, args.card, checkCardstr)),
      }),
      Card(args.card()),
    ]);
  }
};

var BoardEditor = {
  controller: function(args) {
    args.oninput = args.oninput || U.nop;
    var rowSizes = [3, 5, 5];
    this.board = rowSizes.map(function(sz) {
      return U.range(sz).map(function() {
        return m.prop('');
      });
    });
    this.oninput = function() {
      args.oninput(this.board);
    };
  },
  view: function(ctrl, args) {
    var board = ctrl.board;
    return m('.editable.board', board.map(function(row) {
      return m('.row', [
        m('.cards', row.map(function(card) {
          return m.component(CardEditor, {
            card: card,
            oninput: ctrl.oninput,
          });
        })),
      ]);
    }));
  }
};

var PullEditor = {
  controller: function(args) {
    args.oninput = args.oninput || U.nop;
    this.row = (args.cards || ['', '', '']).map(function(card) {
      return m.prop(card);
    });
    this.oninput = function() {
      args.oninput(this.row);
    };
    this.onplus = function() {
      this.row.push(m.prop(''));
    };
    this.onminus = function() {
      this.row.pop();
    };
  },
  view: function(ctrl) {
    var row = ctrl.row;
    return m('.editable.pull', [
      m('.row', row.map(function(card) {
        return m.component(CardEditor, {
          card: card,
          oninput: ctrl.oninput,
        });
      })),
      m('button', { onclick: ctrl.onplus.bind(ctrl) }, '+'),
      m('button', { onclick: ctrl.onminus.bind(ctrl) }, '-'),
    ]);
  }
};

module.exports = {
  BoardEditor: BoardEditor,
  PullEditor: PullEditor,
}
