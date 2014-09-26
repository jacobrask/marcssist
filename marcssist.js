"use strict";

/**
 * @param {object} options
 */

var Marcssist = function(options) {
  this._options = options;
  this._id = 0;
};


/**
 * Flatten all styles to objects with selector/style pairs.
 *
 * @param {object} style
 * @param {string} selector Optional prefix for class name.
 * @returns {string}
 */

Marcssist.prototype.insert = function(style, selector) {
  var className = "mx__"+(this._id++);
  selector = (selector ? selector+" ." : ".") + className;
  this._process(selector, style);
  return className;
};


/**
 * Flatten all styles to objects with selector/style pairs.
 *
 * @param {selector} obj
 * @param {object} obj
 * @returns {array}
 */

Marcssist.prototype._process = function(sel, obj) {
  var prop, value, style = {}, styles = [];
  for (prop in obj) {
    value = obj[prop];
    // found an object, recurse with property as added selector
    if (value === Object(value)) {
      styles = styles.concat(
        this._process(sel + prop, value)
      );
    } else {
      style[prop] = Array.isArray(value) ? value : [ value ];
    }
  }
  styles.push({
    selector: sel,
    style: style
  });
  return styles;
};
