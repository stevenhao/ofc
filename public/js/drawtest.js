(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1])