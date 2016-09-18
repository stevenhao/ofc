var U = require('../share/utils');
var Card = require('./card');
var rowSizes = [3, 5, 5];
function BoardView(args) {
  console.log('boardview', args);
  var player = args.player;
  var board = args.board;
  var pending = args.pending || [[], [], []];
  var selected = 'selected' in args ? args.selected : -1;
  var active = args.active || false;
  var over = args.over || false;
  var fouled = args.fouled || false;
  var royalties = args.royalties;
  return m('.board',
    { className: active ? 'active' : 'inactive' },
    board.map(function(row, i) {
      return m('.row',
        { className: selected == i ? 'selected' : '' },
        [
          m('.cards', (function() {
            var y = 8, z = 8;
            var A = row.map(function(card) {
              return m('.slot',
                { style: {'z-index': z--} },
                Card(card, { fouled: fouled }));
            });
            var B = pending[i].map(function(card) {
              return m('.slot.pending.clicky',
                { style: {'z-index': y++ + z--},
                  onclick: function() { args.onclickcard(card) },
                },
                Card(card));
            });
            var C = U.range(rowSizes[i] - A.length - B.length).map(function() {
              return m('.slot',
                { style: {'z-index': z--},
                  className: args.onclickrow ? 'clicky' : '',
                  onclick: function() { args.onclickrow(i) },
                },
                Card('', {blank: true}));
            });
            return A.concat(B).concat(C);
          })()),
          (function() {
            if (!over) return null;
            var bonus = royalties[i];
            if (!bonus || !bonus.royalty) return null;
            var bstr = bonus.name + '!&nbsp;&nbsp;+' + bonus.royalty;
            return m('.bonus', {className: bonus.fl ? 'fl' : ''}, m.trust(bstr));
          })(),
        ]);
    }));
}
module.exports = BoardView;
