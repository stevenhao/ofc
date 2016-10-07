var rpc = require('node-json-rpc');
var colors = require('colors');
var serv = new rpc.Server({ port: 7000, strict: false });

var logger = (function() {
  var logger = {};
  logger.red = function() {
    console.log(Array.from(arguments).join(' ').red);
  };
  logger.blue = function() {
    console.log(Array.from(arguments).join(' ').blue);
  };
  logger.white = function() {
    console.log(Array.from(arguments).join(' ').white);
  };
  return logger;
})();

var cpp = (function() {
  var cpp = {};
  const spawn = require('child_process').spawn;
  const subp = spawn('cpp/endpoint');

  var cbks = {};
  var starttimes = {};
  var qid = 0;
  subp.stdout.on('data', (data) => {
    data = data + '';
    data.split('\n').forEach(function(line) {
      logger.blue('cpp stdout:', line);
      if (line.length == 0) return;
      if (line.startsWith("DBG: ")) {
        logger.blue('cpp dbg:', line);
      } else if (line.startsWith("ERR: ")) {
        logger.red('cpp dbg:', line);
      } else {
        var response;
        try {
          response = JSON.parse(line);
        } catch (e) {
          logger.red('parse error:', line, e);
          return;
        }
        var qid = response.id;
        var millis = new Date().getTime() - starttimes[qid];
        var secs = millis / 1000;
        logger.white('response[' + qid + ']', JSON.stringify(response), ' took ', secs, ' seconds');
        cbks[qid](response.result);
      }
    });
  });

  cpp.call = function(name, params, cbk) {
    ++qid;
    logger.white('call[' + qid + ']', name);
    var query = {id: qid, name: name, params: params};
    logger.white('args:', JSON.stringify(query));
    subp.stdin.write(JSON.stringify(query) + '\n');
    cbks[qid] = cbk;
    starttimes[qid] = new Date().getTime();
  };

  return cpp;
})();

cpp.call('getMoves', {
  state: {
    board: [[], [], []],
    discard: [],
    oboard: [[], [], []],
    pull: ['As', 'Ks', 'Qs', 'Js' ,'Ts'],
  },
  seed: 10,
}, function(result) {
  console.log('main: final answer', result);
});

var ai = {};
ai.validateMove = function(move, state) {
  return true;
};
ai.validateSeed = function(seed) {
  return seed;
};
ai.validateCard = function(card) {
  return true;
};
ai.validateRow = function(row) {
  return true;
};
ai.validateBoard = function(board) {
  return true;
};
ai.validateState = function(state) {
  return state.board && state.discard && state.oboard && state.pull;
};

ai.getMoves = function (Q, callback) {
  var state = Q[0], seed = Q[1];
  var error, result;
  if (!(ai.validateState(state) && ai.validateSeed(seed))) {
    error = { code: -32602, message: "Invalid params" };
    callback(error, result);
  } else {
    var query = {state: state, seed: seed};
    cpp.call('getMoves', query, function(result) {
      callback(error, result);
    });
  }
};

ai.evaluate = function (Q, callback) {
  var state = Q[0], move = Q[1], seed = Q[2];
  console.log('ai: evaluate', state, move, seed);
  var error, result;
  if (!(ai.validateState(state) && ai.validateMove(move) && ai.validateSeed(seed))) {
    error = { code: -32602, message: "Invalid params" };
    callback(error, result);
  } else {
    var query = {state: state, move: move, seed: seed};
    cpp.call('evaluate', query, function(result) {
      callback(error, result);
    });
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
