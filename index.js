'use strict';

var P = P || {};

P.Board = function() {
  this.slots = range(13).map(function() { return ''; });
  function getPosition(rowName, rowPosition) {
    var offsets = {'top': 10, 'mid': 5, 'bot': 0};
    return offsets[rowName] + rowPosition;
  }
};

var FantasyLand = {
  controller: function() {
    },

  view: function() {
    }
  };


var C;
function consume(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

pineapple.controller = function() {
  C = this;

  this.setCards = function(cards) {
    this.cards = cards;
    this.slots = {
      board: range(13).map(function(idx) {
          return {
            type: 'board',
            idx: idx,
            card: undefined,
            cardIdx: undefined,
          }
        }),
      hand: this.cards.map(function(card, idx) {
          return {
            type: 'hand',
            idx: idx,
            card: card,
            used: false,
            usedIdx: undefined,
          }
        }),
      handOrder: range(14),
      handInOrder: function() { return this.hand.take(this.handOrder); },
      _top: function() { return this.board.slice(10, 13); },
      mid: function() { return this.board.slice(5, 10); },
      bot: function() { return this.board.slice(0, 5); },
    };
    this.sortByRank();
  }

  this.deal = function() {
    this.setCards(p.getDeck().slice(0, 14));
  }.bind(this);

  this.sortByRank = function() {
    var cards = this.cards;
    function r(c) { return p.rankToNum(p.getRank(cards[c])); }
    function s(c) { return p.getSuit(cards[c]).charCodeAt(0); }
    this.slots.handOrder.sort(
        function(a, b) { return r(b) == r(a) ? s(b) - s(a) : r(b) - r(a); });
  }

  this.sortBySuit = function() {
    var cards = this.cards;
    function r(c) { return p.rankToNum(p.getRank(cards[c])); }
    function s(c) { return p.getSuit(cards[c]).charCodeAt(0); }
    this.slots.handOrder.sort(
        function(a, b) { return s(b) == s(a) ? r(b) - r(a) : s(b) - s(a); });
  }

  this.toggleSort = (function() {
    var sortCount = 0;
    return function() {
      if (sortCount % 2 == 1) {
        this.sortByRank();
      } else {
        this.sortBySuit();
      }
      sortCount += 1;
      return false;
    }
  })().bind(this);

  this.load = function(cardstr) {
    this.setCards(cardstr.split(' '));
  }

  function use(from, to) {
    to.card = from.card;
    to.cardIdx = from.idx;
    from.usedIdx = to.idx;
    from.used = true;
  }

  function unuse(from, to) {
    to.card = undefined;
    to.cardIdx = undefined;
    from.usedIdx = undefined
    from.used = false;
  }

  this.reset = function() {
    this.slots.hand.forEach(function(slot) {
      if (slot.used) {
        unuse(slot, this.slots.board[slot.usedIdx]);
      }
    }.bind(this));
  }.bind(this);

  this.showBestPlay = function() {
    this.bestPlay = b.getBestPlay(this.cards);
    this.reset();
    var want = this.bestPlay.play.bot.concat(this.bestPlay.play.mid).concat(this.bestPlay.play._top);
    want.forEach(function(card, idx) {
      var handIdx = this.cards.indexOf(card);
      use(this.slots.hand[handIdx], this.slots.board[idx]);
    }.bind(this));
  }.bind(this);

  this.clickHandler = function(slot) {
    return function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      console.log('onClick', {slot});
      if (slot.type == 'board') {
        if (slot.card) {
          unuse(this.slots.hand[slot.cardIdx], slot);
        }
      } else if (slot.type == 'hand') {
        if (!slot.used) {
          for (var toSlot of this.slots.board) {
            if (!toSlot.card) {
              use(slot, toSlot);
              break;
            }
          }
        } else {
          this.slots.board[slot.usedIdx].card = undefined;
          this.slots.board[slot.usedIdx].cardIdx = undefined;
          slot.used = false;
          slot.usedIdx = undefined;
        }
      }
      return false;
    }.bind(this);
  }

  this.deal();
}

pineapple.view = function(ctrl) {
  function makeCard(card) {
    return d.draw(card);
  }

  function makeCardSlot(slot) {
    var children = [];
    if (slot.card) {
      children.push(makeCard(slot.card));
    }
    if (slot.used) {
      children.push(m('div.layer'));
    }

    return m('div.slot.poker-card-slot', {
        onclick: ctrl.clickHandler(slot),
        onmouseup: consume,
        onmousedown: consume,
        ondblclick: consume,
        }, children);
  }

  var _top = ctrl.slots._top();
  var mid = ctrl.slots.mid();
  var bot = ctrl.slots.bot();
  function ph(slots) {
    return p.getPokerHand(slots.map(function(slot) {
      return slot.card;
    }));
  }

  function bonusName(bonus) {
    if (bonus.royalty > 0) {
      return [bonus.name + '! ', m('span.bonus', '+' + bonus.royalty)];
    } else {
      return [];
      //return ['Nothing! ', m('span.bonus', '+0')];
    }
  }

  return m('div', [
      m('h1', 'Pineapple!'),
      m('h2', 'The Board'),
      m('div', [
        m('div.row', [
          m('div.slots', _top.map(makeCardSlot)),
          m('div.hand_str', bonusName(p.topBonus(ph(_top)))),
         ]),
        m('div.row', [
          m('div.slots', mid.map(makeCardSlot)),
          m('div.hand_str', bonusName(p.midBonus(ph(mid)))),
         ]),
        m('div.row', [
          m('div.slots', bot.map(makeCardSlot)),
          m('div.hand_str', bonusName(p.botBonus(ph(bot)))),
         ]),
        ]),
      m('h2', 'Your Hand'),
      m('button', { onclick: ctrl.toggleSort }, 'Sort'),
      m('button', { onclick: ctrl.reset }, 'Reset'),
      m('div', [
        m('div.row', ctrl.slots.handInOrder().slice(0, 7).map(makeCardSlot)),
        m('div.row', ctrl.slots.handInOrder().slice(7, 14).map(makeCardSlot)),
        ]),
      m('button', { onclick: ctrl.showBestPlay }, 'Show Best Play'),
      m('button', { onclick: ctrl.deal }, 'New'),
      m('h2', 'Load'),
      m('form', [
          m('label', 'Enter Hand'),
          m('input', { oninput: m.withAttr('value', ctrl.forms.hand) }, value: ctrl.forms.hand())
          m("button[type=button]", {onclick: args.onsave.bind(this, contact)}, "Save")
          ]),
      ]);
}

m.module(document.getElementById('pineapple'), {
  controller: pineapple.controller,
  view: pineapple.view
});
