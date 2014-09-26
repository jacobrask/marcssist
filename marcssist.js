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
  var value, prop, pfxProp, pfxVal;
  for (prop in style) {
    value = style[prop];
    prop = prefixProp(prop) || prop;
    value = prefixValue(value, prop) || value;
    style[prop] = value;
  }
  return style;
};


function hyphenate(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-'+$0.toLowerCase() });
}

var prefixRe = /^(-[a-z]+-)(.*)/;
var prefixedProps = {};
var prefix = null;
function updatePrefixedProps() {
  var style = window.getComputedStyle(document.documentElement);
  var l = style.length, match, i;
  for (i = 0; i < l; i++) {
    if ((match = style[i].match(prefixRe)) && !(match[2] in style)) {
      prefix || (prefix = match[1]);
      prefixedProps[match[2]] = true;
    }
  }
}

function prefixProp(prop) {
  if (prefix === null) updatePrefixedProps();
  if (prefixedProps[prop]) {
    return prefix + prop;
  }
}

var prefixedValues = {};
var style = document.createElement("div").style;
function prefixValue(value, prop) {
  if (prefix === null) updatePrefixedProps();
  // Cached
  if (prefixedValues[prop] === value) {
    return prefix + value;
  }
  style[prop] = "";
  style[prop] = value;
  // Supported
  if (!!style[prop]) return;
  style[prop] = prefix+value;
  // Supported with prefix
  if (!!style[prop]) {
    prefixedValues[prop] = value;
    return prefix + value;
  }
}
