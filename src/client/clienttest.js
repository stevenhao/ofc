var rpc = require('node-json-rpc');

// Create a server object with options 
var client = new rpc.Client({ port: 80, host: 'o.dev', path: '/server' });

client.call({'method': 'play', 'params': [1, 2, 'move 1']},
  function(err, res) {
    console.log(err, res.result);
  }
);

client.call({'method': 'list', 'params': [1, 2, 'move 1']},
  function(err, res) {
    console.log(err, res.result);
  }
);


client.call({ "method": "myMethod", "params": [1,2] },
  function (err, res) {
    // Did it all work ? 
    if (err) { console.log(err); }
    else { console.log(res); }
  }
);


var c = require('./client');
console.log('required:', c);
