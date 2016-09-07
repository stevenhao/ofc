'use strict';

var drawtest = drawtest || {};
drawtest.controller = function() {
  this.feature = m.prop('As');
};

drawtest.view = function(ctrl) {
  return m('div',{style:{'background-color': '#CCC'}}, [
    m('div.poker-holder', {style: 'width: 300px; height: 375px'}, d.draw(ctrl.feature(), true)),
    m('div',{style: 'max-width:600px'}, p.allCards.map(function(card) {
        return m("div.poker-holder",
            {style: 'width: 30px; height: 37.5px; display: inline-block',
              onclick: function() {ctrl.feature(card);}},
            d.draw(card));
      })),
    ]);

};
m.module(document.body, {
  controller: drawtest.controller,
  view: drawtest.view,
});
