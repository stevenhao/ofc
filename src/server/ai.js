var rpc = require('node-json-rpc');
var serv = new rpc.Server({ port: 7000, strict: false });

const spawn = require('child_process').spawn;
const cpp = spawn('cpp/endpoint');

cpp.stdout.on('data', (data) => {
  console.log(`cpp stdout: ${data}`);
});

cpp.stdin.cork();
cpp.stdin.write('hello\n');
cpp.stdin.uncork();
cpp.stdin.cork();
cpp.stdin.write('world\n');
cpp.stdin.uncork();

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
