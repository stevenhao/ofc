var rpc = require('node-json-rpc');
var serv = new rpc.Server({ port: 7000, strict: false });

var pineapple = {

};
var app = {};
app.game = function(uids) {
  this.players = uids;
  this.history = [];
  this.game = new pineapple.game();
};

app.db = {
  games: {},
  load: function(gid) {
    return JSON.parse(this.games[gid]);
  },
  save: function(gid, state) {
    this.games[gid] = JSON.stringify(state);
  },
  list: function(uid) {
    //var all = Object.keys(this.games);
    var gids = Object.keys(this.games);
    var all = gids.map(function(gid) {
      return JSON.parse(this.games[gid]);
    }.bind(this));
    return all;
  },
};

app.counter = function(cnt) {
  if (!cnt) cnt = 0;
  return function() {
    cnt += 1;
    return cnt;
  }
};

app.generateGid = app.counter(0);
app.generateUid = app.counter(1000);

app.play = function(gid, uid, move) {
  var game = app.db.load(gid);
  game.push({ uid: uid, move: move });
  app.db.save(gid, game);
};

app.create = function(pid) {
  var gid = app.generateGid();
  var game = [];
  app.db.save(gid, game);
  return gid;
};

app.list = function(pid) {
  return app.db.list(pid);
};

app.test = function(x) {
  return x * x;
};

var routes = ['test', 'list', 'create', 'play'];
routes.forEach(function(method) {
  serv.addMethod(method, function(para, callback) {
    var error, result;
    console.log('hit route', method, para);
    var result = app[method].apply(app, para);
    console.log('result', result);
    callback(error, result);
  });
});

// Add your methods 
serv.addMethod('myMethod', function (para, callback) {
  var error, result;
  if (para.length === 2) {
    result = para[0] + para[1];
  } else if (para.length > 2) {
    result = 0;
    para.forEach(function (v, i) {
      result += v;
    });
  } else {
    error = { code: -32602, message: "Invalid params" };
  }
  callback(error, result);
});

// Start the server 
serv.start(function (error) {
  // Did server start succeed ? 
  if (error) throw error;
  else console.log('Server running ...');
});
