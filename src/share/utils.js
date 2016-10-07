var U = {
  chain: function() {
    var fns = arguments;
    return function(x) {
      var i;
      for (i = fns.length - 1; i >= 0; --i) {
        x = fns[i](x);
      }
      return x;
    }
  },
  lower: function(s) {
    return s.lower();
  },
  c: function(x) { return function() { return U.clone(x) } },

  nop: function() {},

  clone: function(obj) {
    if (obj == undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
  },

  range: function(x, y) {
    if (y == undefined) {
      y = x;
      x = 0;
    }
    var ret = [];
    for (var i = x; i < y; i += 1) {
      ret.push(i);
    }
    return ret;
  },

  flatten: function(matr) {
    var ret = [];
    matr.forEach(function(ar) { ret = ret.concat(ar) });
    return ret;
  },

  unique: function(ar) {
    var ret = true;
    ar.forEach(function(x, i) { ret = ret && ar.indexOf(x, i + 1) != -1 });
    return ret;
  },

  subset: function(a, b) {
    var ret = true;
    a.forEach(function(x) { ret = ret && b.indexOf(a) != -1 });
  },

  subtr: function(a, b) {
    var ret = [];
    a.forEach(function(x) { if (b.indexOf(x) == -1) ret.push(x) });
    return ret;
  },

  mconcat: function(a, b) {
    var n = Math.min(a.length, b.length), ret = [];
    for (var i = 0; i < n; i += 1) ret.push(a[i].concat(b[i]));
    return ret;
  },

  all: function(a) {
    var ret = true;
    a.forEach(function(x) { ret = ret && x; });
    return ret;
  }
};

module.exports = U;

Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

Array.prototype.shuffle = function() {
    var j, x, i;
    for (i = this.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = this[i - 1];
        this[i - 1] = this[j];
        this[j] = x;
    }
}

Array.prototype.take = function(indices) {
  return indices.map(function(idx) {
    return this[idx];
  }.bind(this));
}

Array.prototype.contains = function(el) {
  return this.indexOf(el) != -1;
};

Array.prototype.remove = function(el) {
  if (this.indexOf(el) != -1) {
    this.splice(this.indexOf(el), 1);
  }
};

