var Card = require('./card');
module.exports = function(args) {
  console.log('Actions', args);
  var pull = args.pull || [];
  var used = args.used || [];
  var r = 1; while (pull.length / r > r * 2 + 5) r += 1;

  var slots = m('.pull', range(r).map(function(i) {
    return pull.splice(0, Math.floor(pull.length / (r - i)));
  }).map(function(row) {
    return m('.row',
      {style: {'min-width': row.length*40+4 }},
      row.map(function(card, i) {
        if (used.contains(card)) {
          return m('.slot', {
          });
        } else {
          return m('.slot.clicky', {
            onclick: function() { args.onuse(card) },
          }, Card(card));
        }
      }));
  }));

  var pullBtn = m('.btn.wide.help', args.canpull ?
        { onclick: args.onpull } :
        { className: 'hide' } , 'Pull');
  var buttons = m('.buttons', [
    m('.btn.round.sort', args.cansort ?
        { onclick: args.onsort } :
        { className: 'hide' }, 'SORT'),
    m('.btn.round.commit', args.cancommit ?
        { onclick: args.oncommit } :
        { className: 'hide' } , 'SET'),
    m('.btn.wide.help', args.canhelp ?
        { onclick: args.onhelp } :
        { className: 'hide' } , 'Ask God'),
  ]);

  return m('.actions', [ slots, pullBtn, buttons ]);
}
