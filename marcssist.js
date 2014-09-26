(function() {
"use strict";


// Global counter to keep class names unique
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
  function insert(style, selector) {
    var className = "mx__"+(classId++);
    selector = (selector ? selector+" ." : ".") + className;
    var declarations = processStyles(selector, style);
    if (options == null || options.prefix !== false) {
      declarations.forEach(function(decl) {
        addPrefixes(decl.style);
      });
    }
    insertRules(declarations);
    return className;
  }


  /**
   * Flatten all styles to objects with selector/style pairs.
   *
   * @param {selector} obj
   * @param {object} obj
   * @returns {array}
   */

  function processStyles(sel, obj) {
    var prop, value, style = {}, styles = [];
    for (prop in obj) {
      value = obj[prop];
      // found an object, recurse with property as added selector
      if (isPlainObject(value)) {
        styles = styles.concat(
          processStyles(sel + prop, value)
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
  }


  var sheet = null;
  function createStyleSheet() {
    var ss = document.createElement("style");
    document.head.appendChild(ss);
    sheet = ss.sheet;
  }

  function insertRules(rules) {
    if (sheet === null) createStyleSheet();
    rules.forEach(function(rule) {
      var pairs = [], prop;
      for (prop in rule.style) {
        pairs.push(prop + ":" + rule.style[prop]);
      }
      console.log(pairs);
      sheet.insertRule(rule.selector + "{" + pairs.join(";") + "}", 0);
    });
  }

  function hyphenate(str) {
    return str.replace(/[A-Z]/g, function($0) { return '-'+$0.toLowerCase() });
  }
  function isPlainObject(obj) {
    return obj === Object(obj)
      && Object.prototype.toString === obj.toString;
  }


  function addPrefixes(style) {
    var value, prop, pfxProp, pfxVal;
    for (prop in style) {
      value = style[prop];
      prop = prefixProp(prop) || prop;
      value = prefixValue(value, prop) || value;
      style[prop] = value;
    }
    return style;
  }

  var prefixedProps = {};
  var prefix = null;
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

  this.insert = insert;
};

var marcssist = Marcssist;
marcssist.insert = Marcssist().insert;

if (typeof module !== "undefined" && module.exports) {
  module.exports = marcssist;
} else {
  window.marcssist = marcssist;
}

})();
