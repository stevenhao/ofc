var rpc = require('node-json-rpc');
var serv = new rpc.Server({ port: 7000, strict: false });

var cpp = (function() {
  var cpp = {};
  const spawn = require('child_process').spawn;
  const subp = spawn('cpp/endpoint');

  var cbks = {};
  var qid = 0;
  subp.stdout.on('data', (data) => {
    console.log('cpp: on data', data);
    data = data + '';
    data.split('\n').forEach(function(line) {
      if (line.length == 0) return;
      var response;
      try {
        response = JSON.parse(line);
      } catch (e) {}
      console.log('response', response);
      cbks[line.id](response.result);
    });
  });

  cpp.call = function(name, params, cbk) {
    console.log('cpp: calling', name, params);
    ++qid;
    var query = {id: qid, name: name, params: params};
    console.log('cpp: writing', JSON.stringify(query));
    subp.stdin.cork();
    subp.stdin.write(JSON.stringify(query));
    subp.stdin.uncork();
    console.log('cpp: saving callback');
    cbks[qid] = cbk;
  };

  return cpp;
})();

cpp.call('evaluate', [1, 2, 3], function(result) {
  console.log('main: final answer', result);
});


var ai = {};
ai.validate = function(query) {
  console.log('validate', query);
  console.log(query.board && query.discard);
  console.log(query.oboard && query.pull);
  return query.board && query.discard && query.oboard && query.pull;
};

ai.getMoves = function (Q, callback) {
  var query = Q[0];
  console.log('ai: getMoves', query);
  var error, result;
  if (!ai.validate(query)) {
    error = { code: -32602, message: "Invalid params" };
    callback(error, result);
  } else {
    // cpp.stdin.write(JSON.stringify(query...));
    // cpp.stdout.once('data', (data) => {
    //   result = JSON.parse(data);
    //   callback(error, result);
    // });

    var rows = [
      {play: [-1, 1, 1]},
      {play: [0, -1, 2]},
      {play: [0, -1, 1]},
    ];
    result = rows;
    callback(error, result);
  }
};

ai.evaluate = function (Q, callback) {
  var query = Q[0], move = Q[1];
  console.log('ai: evaluate', query);
  var error, result;
  if (!ai.validate(query)) {
    error = { code: -32602, message: "Invalid params" };
    callback(error, result);
  } else {
    // cpp.stdin.write(JSON.stringify(query...));
    // cpp.stdout.once('data', (data) => {
    //   result = JSON.parse(data);
    //   callback(error, result);
    // });

    result = {
      trials: 10,
      rph: 100,
      fl: 8,
      foul: 1,
      matchup: 48,
      score: 180,
      scoresq: 4000,
    };
    callback(error, result);
  }
};

serv.addMethod('getMoves', ai.getMoves.bind(ai));
serv.addMethod('evaluate', ai.evaluate.bind(ai));

// Start the server 
serv.start(function (error) {
  // Did server start succeed ? 
  if (error) throw error;
  else console.log('Server running ...');
});
