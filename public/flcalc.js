(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var FantasyLand = {
  controller: function(args) {
    this.cards = m.prop(args.cards || Poker.getDeck().slice(0, args.len || 14));
    this.active = m.prop(true);
    this.board = m.prop([[], [], []]);
    this.oncommit = function(pending) {
      this.board(pending);
      this.active(false);
      this.kill = true;
      m.redraw(true);
    };
    this.kill = false;
  },
  view: function(ctrl, args) {
    if (ctrl.kill) {
      ctrl.kill = false;
      return m('div', 'redrawing'); // next cycle will recreate components
    }
    return m('div', [
      (function() {
        return m('div', [
          m.component(Game, {
            active: ctrl.active(),
            endgame: !ctrl.active(),
            board: ctrl.board(),
            isFL: true,
            pull: ctrl.cards(),
            toDiscard: ctrl.cards().length - 13,
            oncommit: ctrl.oncommit.bind(ctrl),
            brain: args.brain,
          }),
        ]);
      })(),
    ]);
  },
};

var FLCalc = {
  controller: function(args) {
    this.cards = m.prop(Poker.getDeck().slice(0, 14).sort(Poker.byRank));
    if (m.route.param("cardstr")) {
      var cardstr = m.route.param("cardstr");
      cardstr = range(cardstr.length/2).map(function(i) {
        return cardstr.substr(i*2, 2);
      }).join(' ');
      this.cards(Poker.parseHandstr(cardstr));
    }
    this.inp = m.prop(Poker.toHandstr(this.cards()));
    this.a = 1;
    this.b = 0;
    this.refresh = function() {
      var cardstr = this.inp();
      cardstr = this.inp().split(/\s+/).join('');
      m.route("/fl/" + cardstr);
    };
  },
  view: function(ctrl, args) {
    return m('div', [
      m.component(FantasyLand, {
        len: 14,
        brain: function(board, pull) {
          // we know this is a fantasy land hand
          var trace = Brain.playFL(pull).play;
          return [trace._top, trace.mid, trace.bot];
        },
        cards: ctrl.cards(),
      }),
      m('textarea.edit', {
        value: ctrl.inp(),
        oninput: m.withAttr('value', ctrl.inp),
        onkeydown: function(ev) {
          if (ev.code == 'Enter' && !ev.shiftKey && !ev.ctrlKey) {
            ev.preventDefault();
            ctrl.refresh();
          }
        }
      }),
    ]);
  },
};



},{}]},{},[1])