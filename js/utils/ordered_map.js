define(function(require, exports, module) {
'use strict';

/**
 * Module dependencies
 */
var baseCompare = require('compare');
var binsearch = require('binsearch');

function OrderedMap(list, compare) {
  if (!compare) {
    compare = baseCompare;
  }

  this.compare = function(a, b) {
    return compare(a[0], b[0]);
  };

  if (list) {
    this.items = list.sort(this.compare);
  } else {
    this.items = [];
  }
}
module.exports = OrderedMap;

OrderedMap.prototype = {
  has: function(value) {
    return this.indexOf(value) !== null;
  },

  insertIndexOf: function(value) {
    return binsearch.insert(
      this.items,
      [value],
      this.compare
    );
  },

  previous: function(key) {
    var idx = this.indexOf(key);
    if (idx !== null && this.items[idx - 1]) {
      return this.items[idx - 1][1];
    }
    return null;
  },

  next: function(key) {
    var idx = this.indexOf(key);
    if (idx !== null && this.items[idx + 1]) {
      return this.items[idx + 1][1];
    }
    return null;
  },

  indexOf: function(value) {
    return binsearch.find(
      this.items,
      [value],
      this.compare
    );
  },

  set: function(key, value) {
    var arr = [key, value];

    var idx = binsearch.insert(
      this.items,
      arr,
      this.compare
    );

    var prev = this.items[idx];
    var remove = 0;

    if (prev && prev[0] === key) {
      remove = 1;
    }

    this.items.splice(idx, remove, arr);

    return value;
  },

  get: function(item) {
    if (typeof(item) === 'undefined') {
      throw new Error('cannot search "undefined" values');
    }

    var idx = this.indexOf(item);
    if (idx !== null) {
      return this.items[idx][1];
    }
    return null;
  },

  remove: function(key) {
    var idx = this.indexOf(key);

    if (idx !== null) {
      this.items.splice(idx, 1);
    }
  },

  get length() {
    return this.items.length;
  }
};

});
