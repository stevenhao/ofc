var pineapple = {};
pineapple.controller = function() {
}

pineapple.view = function(ctrl) {
  return m('span', 'Hello, World!');
}

m.module(document.getElementById('pineapple'), {
  controller: pineapple.controller,
  view: pineapple.view
});
