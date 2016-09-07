function nop() {}
function cp(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function range(x, y) {
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
