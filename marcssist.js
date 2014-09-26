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
  var declarations = this._process(selector, style);
  declarations.forEach(function(decl) {
    this._prefix(decl.style);
  }, this);
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
      style[hyphenate(prop)] = value;
    }
  }
  styles.push({
    selector: sel,
    style: style
  });
  return styles;
};

Marcssist.prototype._prefix = function (style) {
  var value, prop, values;

  for (prop in style) {
    value = style[prop];

    // assign the same values array to all aliased properties
    style[prop] = values = [value];
  }
  return style;
};

function hyphenate(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-'+$0.toLowerCase() });
}
