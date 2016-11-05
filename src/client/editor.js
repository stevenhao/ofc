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
    var cards = (args.board || [['', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]).map(function(row) {
      return row.map(function(card) {
        return m.prop(card);
      });
    });
    var oninput = function() {
      var board = cards.map(function(row) {
        return row.map(function(card) {
          return card();
        });
      });
      args.oninput(board);
    };

    this.cards = cards;
    this.oninput = oninput;
  },
  view: function(ctrl, args) {
    var cards = ctrl.cards;
    console.log('boardeditor: view:', cards);
    return m('.editable.board', cards.map(function(row) {
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
    var cards = (args.pull || ['', '', '']).map(function(card) {
      return m.prop(card);
    });
    var oninput = function() {
      var pull = cards.map(function(card) {
        return card();
      });
      args.oninput(pull);
    };
    var onplus = function() {
      cards.push(m.prop(''));
      oninput();
    };
    var onminus = function() {
      cards.pop();
      oninput();
    };

    this.cards = cards;
    this.oninput = oninput;
    this.onplus = onplus;
    this.onminus = onminus;
  },
  view: function(ctrl) {
    var cards = ctrl.cards;
    return m('.editable.pull', [
      m('.row', cards.map(function(card) {
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
