
module.exports = (function() {
  var Client = {};
  var rpc = require('node-json-rpc');
  var rpcClient = new rpc.Client({ port: 80, host: 'o.dev', path: '/server' });

  Client.getMoves = function(query, cbk) {
    query.pull = query.pull || [];
    query.oboard = query.oboard || [[], [], []];
    query.discard = query.discard || [];
    var int_max = 1000000000;
    var seed = Math.floor(Math.random() * int_max);

    console.log('client: getMoves', query);
    rpcClient.call({'method': 'getMoves', 'params': [query, seed]},
      function(err, res) {
        console.log('client: getMoves result:', res);
        cbk(res.result);
      }
    );

    // query = { board, pull, oboard, discard, options }
  };

  Client.evaluate = function(query, move, seed, cbk) {
    query.pull = query.pull || [];
    query.oboard = query.oboard || [[], [], []];
    query.discard = query.discard || [];

    console.log('client: evaluate:', query);
    rpcClient.call({'method': 'evaluate', 'params': [query, move, seed]},
      function(err, res) {
        console.log('client: evaluate result:', res);
        cbk(res.result);
      }
    );

    // query = { board, pull, oboard, discard, options }
  };

  return Client;
})();
