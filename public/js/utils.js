(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.nop = function() {}
function cp(obj) {
  return JSON.parse(JSON.stringify(obj));
}
window.range = function(x, y) {
  if (y == undefined) {
    y = x;
    x = 0;
  }
  var ret = [];
  for (var i = x; i < y; i += 1) {
    ret.push(i);
  }
  return ret;
}

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

},{}]},{},[1])