// objectExt.js

'use strict;'
if (objectExt) {
    throw new Error('objectExt.js included twice.');
}
// quick compare for objects without functions, loops and other non-JSONABLE stuff.
Object.compare = function(o) {
    return JSON.stringify(this) == JSON.stringify(o);
}

var objectExt = {
    compare : function(x, y) {
        return JSONfn.stringify(x) == JSONfn.stringify(y);
    },
    // filched from http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    // This is slower than a simple comparison of objects using JSON
    deepCompare : function(x, y) {
      if (!objectExt.compare(x, y)) {
          return false;
      }
      var p;

      // remember that NaN === NaN returns false
      // and isNaN(undefined) returns true
      if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
           return true;
      }

      // Compare primitives and functions.     
      // Check if both arguments link to the same object.
      // Especially useful on the step where we compare prototypes
      if (x === y) {
          return true;
      }

      // Works in case when functions are created in constructor.
      // Comparing dates is a common scenario. Another built-ins?
      // We can even handle functions passed across iframes
      if ((typeof x === 'function' && typeof y === 'function') ||
         (x instanceof Date && y instanceof Date) ||
         (x instanceof RegExp && y instanceof RegExp) ||
         (x instanceof String && y instanceof String) ||
         (x instanceof Number && y instanceof Number)) {
          return x.toString() === y.toString();
      }

      // At last checking prototypes as good as we can
      if (!(x instanceof Object && y instanceof Object)) {
          return false;
      }

      if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
          return false;
      }

      if (x.constructor !== y.constructor) {
          return false;
      }

      if (x.prototype !== y.prototype) {
          return false;
      }

      // Check for infinitive linking loops
      if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
           return false;
      }

      // Quick checking of one object being a subset of another.
      // todo: cache the structure of arguments[0] for performance
      for (const p in y) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
              return false;
          }
          else if (typeof y[p] !== typeof x[p]) {
              return false;
          }
      }

      for (const p in x) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
              return false;
          }
          else if (typeof y[p] !== typeof x[p]) {
              return false;
          }

          switch (typeof (x[p])) {
              case 'object':
              case 'function':

                  leftChain.push(x);
                  rightChain.push(y);

                  if (!compare2Objects (x[p], y[p])) {
                      return false;
                  }

                  leftChain.pop();
                  rightChain.pop();
                  break;

              default:
                  if (x[p] !== y[p]) {
                      return false;
                  }
                  break;
          }
      }

      return true;
    }
}

Object.prototype.deepCompare = function(o) {
    return objectExt.deepCompare(this, o);
}

Object.prototype.deepCopyValues = function() {
    // returns a deep copy of this without function members - quicker
    return deepCopy(this);
}

Object.prototype.deepCopy = function() {
    // returns a deep copy of this
    function deepCopyFunctions(org, copy) {
        if (org == null) {
            return null;
        }
        var keys = Object.keys(org);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const o = org[key];
            if (typeof(o) == 'function') {
                copy[key] = o;
            } else if (typeof(o) == 'object') {
                copy[key] = deepCopyFunctions(o, copy[key]);
            }
        }
        return copy;
    }
    const copy = this.deepCopyValues();
    return deepCopyFunctions(this, copy);
}

Object.prototype.mergeIn = function(o) {
    // returns o merged into "this" and returns "this"
    if (!o) {
        return this; // nothing to merge
    }
    if (typeof(o) != 'object') {
        throw new Error('Object.mergeIn: Argument must be an object.');
    }
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        this[key] = o[key];
    }
    return this;
}

Object.prototype.mergeOut = function(o) {
    // returns o merged into "this". Does not affect "this" or o   
    if (!o) {
        return this.deepCopy(); // nothing to merge, just makle a copy.
    }
    if (typeof(o) != 'object') {
        throw new Error('Object.mergeOut: Argument must be an object.');
    }
    const targ = this.deepCopy();
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        targ[key] = o[key];
    }
    return targ;
}

