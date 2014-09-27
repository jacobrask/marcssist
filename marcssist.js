(function() {
"use strict";


/**
 * Global id to keep class names unique.
 * @type {number}
 */

var classId = 0;


/**
 * @param {object} options
 * @param {object} options.prefix=true Add vendor prefixes
 */

function Marcssist(options) {

  // Don't require |new|
  if (!(this instanceof Marcssist)) {
    return new Marcssist(options);
  }

  /**
   * Main function to insert a style object.
   *
   * @param {object} style
   * @param {string} selector= Optional prefix for class name.
   * @returns {string}
   */
  this.add = function (style, selector) {
    var className = "mx__"+(classId++);
    selector = (selector ? selector+" ." : ".") + className;
    var rules = rulesFromStyle(selector, style);
    if (options == null || options.prefix !== false) {
      rules.forEach(function(set) {
        addPrefixes(set.style);
      });
    }
    insertRules(rules);
    return className;
  };
}


var marcssist = Marcssist;
marcssist.add = new Marcssist().add;

if (typeof module !== "undefined" && module.exports) {
  module.exports = marcssist;
} else {
  window.marcssist = marcssist;
}


/**
 * Prefix detected when updating |prefixedProps|.
 * @type {string?}
 */

var prefix = null;


/**
 * Lookup map of properties that should be prefixed.
 * @type {object}
 */

var prefixedProps = {};

function updatePrefixedProps() {
  var prefixRe = /^(-[a-z]+-)(.*)/;
  var style = window.getComputedStyle(document.documentElement);
  for (var i = 0, l = style.length, match; i < l; i++) {
    if ((match = style[i].match(prefixRe)) && !(match[2] in style)) {
      prefix || (prefix = match[1]);
      prefixedProps[match[2]] = true;
    }
  }
}


/**
 * Lookup map of property/value pairs that should be prefixed.
 * @type {object}
 */

var prefixedValues = {};


/**
 * Style object used to test if a property/value pair is supported.
 * @type {object}
 */

var dummyStyle = document.createElement("div").style;


/**
 * Style element, used for all instances.
 * @type {Element?}
 */

var sheet = null;

function createStyleSheet() {
  var ss = document.createElement("style");
  document.head.appendChild(ss);
  sheet = ss.sheet;
}


/**
 * Flattens any nested selector combinators, returning CSS rule sets
 * represented by selector/style pairs.
 *
 * @param {string} selector Base CSS selector
 * @param {object} block CSS property/values declaration block
 * @returns {array.object}
 */

function rulesFromStyle(selector, block) {
  var prop, value, style = {}, rules = [];
  for (prop in block) {
    value = block[prop];
    // Found an object, recurse with property added to selector.
    if (isPlainObject(value)) {
      rules = rules.concat(
        rulesFromStyle(combineSelectors(selector, prop), value)
      );
    } else {
      if (prop === "content") value = "'"+value+"'";
      style[hyphenate(prop)] = value;
    }
  }
  rules.push({
    selector: selector,
    style: style
  });
  return rules;
}


/**
 * Add rule sets to stylesheet.
 *
 * @param {array} rules
 */

function insertRules(rules) {
  if (sheet === null) createStyleSheet();
  rules.forEach(function(rule) {
    var pairs = [], prop;
    for (prop in rule.style) {
      pairs.push(prop + ":" + rule.style[prop]);
    }
    sheet.insertRule(rule.selector + "{" + pairs.join(";") + "}", 0);
  });
}


/**
 * Pseudo classes/elements and attribute selectors should immediately
 * follow the previous selector, others should be space separated.
 *
 * @param {string} a
 * @param {string} b
 * @returns {string} "a b" or "ab"
 */

function combineSelectors(a, b) {
  var separator = /^[:\[]/.test(b) ? "" : " ";
  return a + separator + b;
}


/**
 * Add vendor prefixes to style block.
 *
 * @param {object} style
 * @returns {object} same object as argument
 */

function addPrefixes(style) {
  var value, prop;
  for (prop in style) {
    value = style[prop];
    prop = prefixProp(prop) || prop;
    value = prefixValue(value, prop) || value;
    style[prop] = value;
  }
  return style;
}


function prefixProp(prop) {
  if (prefix === null) updatePrefixedProps();
  if (prefixedProps[prop]) {
    return prefix + prop;
  }
}


function prefixValue(value, prop) {
  if (prefix === null) updatePrefixedProps();
  // Cached
  if (prefixedValues[prop] === value) {
    return prefix + value;
  }
  dummyStyle[prop] = "";
  dummyStyle[prop] = value;
  // Supported
  if (!!dummyStyle[prop]) return;
  dummyStyle[prop] = prefix+value;
  // Supported with prefix
  if (!!dummyStyle[prop]) {
    prefixedValues[prop] = value;
    return prefix + value;
  }
}


function hyphenate(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-'+$0.toLowerCase(); });
}


/**
 * Check if an object is an object, and has the original toString method.
 * If toString is changed, the caller most likely wants the string value
 * and not the object properties.
 *
 * @param {*} obj
 * @returns {boolean}
 */

function isPlainObject(obj) {
  return obj === Object(obj)
      && Object.prototype.toString === obj.toString;
}


})();
