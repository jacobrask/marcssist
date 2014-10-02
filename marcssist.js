/**
 * Turn a JavaScript object with CSS styles into a class in a stylesheet.
 *
 * @example
 *
 *     var mx = window.marcssist;
 *     var buttonClass = mx.style({
 *       color: "yellow",
 *       padding: 10,
 *       ":hover" { color: "black" }
 *     });
 *     myDiv.classList.add(buttonClass);
 *     // .mx__0 { color: yellow; padding: 10px }
 *     // .mx__0:hover { color: black }
 */

;(function () {
"use strict";

/**
 * Reuse the same style sheet for all instances.
 * @type {CSSStyleSheet?}
 */

var sharedSheet = null;


/**
 * Reuse the same detected vendor prefix for all instances.
 * @type {string?}
 */

var currentPrefix = null;


/**
 * Properties assumed to need a vendor prefix. Properties should only be added
 * to these lists if there are at least two separate implementations in recent
 * versions of major browsers, where at least one of them are prefixed.
 *
 * @type {object}
 */

var prefixedProps = {
  animation: true,
  animationDelay: true,
  animationDirection: true,
  animationDuration: true,
  animationFillMode: true,
  animationIterationCount: true,
  animationName: true,
  animationPlayState: true,
  animationTimingFunction: true,
  appearance: true,
  backfaceVisibility: true,
  columns: true,
  columnCount: true,
  columnFill: true,
  columnGap: true,
  columnRule: true,
  columnRuleColor: true,
  columnRuleStyle: true,
  columnRuleWidth: true,
  columnSpan: true,
  columnWidth: true,
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  filter: true,
  flex: true,
  flexBasis: true,
  flexDirection: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  justifyContent: true,
  justifySelf: true,
  fontSmoothing: true,
  hyphens: true,
  lineBoxContain: true,
  lineBreak: true,
  lineClamp: true,
  order: true,
  perspective: true,
  perspectiveOrigin: true,
  transform: true,
  transformOrigin: true,
  transformStyle: true,
  userFocus: true,
  userInput: true,
  userModify: true,
  userSelect: true
};


/**
 * Values assumed to need a vendor prefix, if used with any of the properties
 * specified in the object.
 * @type {object}
 */

var prefixedValues = {
  flex: { display: true },
  "inline-flex": { display: true }
};


/**
 * Properties that accept a number but do not need a unit.
 * @type {object}
 */

var unitlessProps = {
  columnCount: true,
  fillOpacity: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};


/**
 * Global id to keep class names unique.
 * @type {number}
 */

var classId = 0;


/**
 * If vendor prefixing is enabled, the current vendor prefix is automatically
 * detected, and then added to the properties and values specified in
 * |prefixedProps| and |prefixedValues|.
 *
 * If auto units is enabled, any property value that is a number will be
 * converted to a string with the specified unit appended.
 *
 * @constructor
 *
 * @param {object} options
 * @param {object} options.prefix=true Add vendor prefixes
 * @param {object} options.unit=px Unit to add to numeric values
 */

function Marcssist(options) {

  // Don't require |new|
  if (!(this instanceof Marcssist)) {
    return new Marcssist(options);
  }

  options || (options = {});
  options.prefix = !options.hasOwnProperty("prefix") ? true : !!options.prefix;
  options.unit = options.hasOwnProperty("unit") ? options.unit : "px";


  /**
   * Also cached as |sharedSheet|.
   * @type {CSSStyleSheet}
   */

  this._sheet = null;


  /**
   * @type {string}
   */

  this._prefix = null;


  /**
   * References the list of properties to prefix, for temporary patching of
   * missing prefixes.
   * @type {object}
   */

  this._prefixedProps = prefixedProps;


  /**
   * References the list of values to prefix, for temporary patching of
   * missing prefixes.
   * @type {object}
   */

  this._prefixedValues = prefixedValues;


  /**
   * Insert one or more style objects as a class in a style sheet.
   *
   * @param {array.object|object} style
   * @param {string} selector= Optional parent selector
   * @returns {string}
   */

  this.style = function (styles, selector) {
    if (styles == null) return "";

    if (this._sheet == null) {
      this._sheet = sharedSheet = (sharedSheet || createStyleSheet());
    }
    if (options.prefix && this._prefix == null) {
      this._prefix = currentPrefix = (currentPrefix || getPrefix());
    }

    var className = "mx__"+(classId++);
    selector = (selector ? selector+" ." : ".") + className;

    var rules = rulesFromStyles(selector, styles);
    if (options.prefix || options.unit !== "") {
      rules.forEach(function(set) {
        if (options.unit !== "") {
          addUnit(set[1], options.unit);
        }
        if (options.prefix) {
          addPrefix(set[1], currentPrefix);
        }
      });
    }

    insertRules(rules, this._sheet);

    return className;
  };

}


/**
 * @returns {string}
 */

function getPrefix() {
  var dummyStyle = getComputedStyle(document.documentElement);
  for (var i = dummyStyle.length, prop; i > 0; i--) {
    prop = dummyStyle[i];
    if (prop[0] === "-") {
      return prop.split("-")[1];
    }
  }
  return "";
}


/**
 * @returns {CSSStyleSheet}
 */

function createStyleSheet() {
  if (document.head == null) {
    throw new Error("Can't add style sheet before <head> is available");
  }
  var ss = document.createElement("style");
  ss.id = "mx__styles";
  document.head.appendChild(ss);
  return ss.sheet;
}


/**
 * Flattens any nested selector combinators, returning CSS rule sets
 * as selector/style vectors.
 *
 * @param {string} selector Base CSS selector
 * @param {object|array.object} styles CSS property/values declaration blocks
 * @returns {array.array}
 */

function rulesFromStyles(selector, styles) {
  if (!Array.isArray(styles)) styles = [styles];
  var prop, value, style = {}, rules = [];
  styles.forEach(function(block) {
    for (prop in block) {
      value = block[prop];
      // Found an object or array, recurse with property added to selector.
      if (isPlainObject(value) || Array.isArray(value)) {
        rules = rules.concat(
          rulesFromStyles(combineSelectors(selector, prop), value)
        );
      } else {
        if (prop === "content") value = "'"+value+"'";
        style[prop] = value;
      }
    }
  });
  rules.push([ selector, style ]);
  return rules;
}


/**
 * Add rule sets to stylesheet.
 *
 * @param {array} rules
 */

function insertRules(rules, sheet) {
  rules.forEach(function(rule) {
    var pairs = [], prop;
    for (prop in rule[1]) {
      pairs.push(hyphenate(prop) + ":" + rule[1][prop]);
    }
    if (pairs.length > 0) {
      sheet.insertRule(rule[0] + "{" + pairs.join(";") + "}", 0);
    }
  });
}


/**
 * Pseudo classes/elements and attribute selectors should immediately
 * follow the previous selector, others should be space separated.
 *
 * @param {string} parent
 * @param {string} child
 * @returns {string}
 */

function combineSelectors(parent, child) {
  var pseudoRe = /^[:\[]/;
  var parents = parent.split(","), children = child.split(",");
  return parents.map(function(parent) {
    return children.map(function(part) {
      var separator = pseudoRe.test(part) ? "" : " ";
      return parent + separator + part;
    }).join(",");
  }).join(",");
}


/**
 * Add vendor prefixes to style block.
 *
 * @param {object} style
 * @param {string} prefix
 * @returns {object} same object as argument
 */

function addPrefix(style, prefix) {
  var value, prop;
  for (prop in style) {
    value = style[prop];
    if (prefixedProps[prop]) {
      style[capitalize(prefix)+capitalize(prop)] = value;
    }
    if (prefixedValues[value] && prefixedValues[value][prop]) {
      if (supports(prop, value)) {
        // No change in object needed, and no check needed next time
        prefixedValues[value][prop] = false;
      } else {
        style[prop] = "-"+prefix+"-"+value;
      }
    }
  }
  return style;
}


/**
 * Add unit to numeric values not in |unitlessProps|.
 *
 * @param {object} style
 * @param {string} unit
 * @returns {object} same object as argument
 */

function addUnit(style, unit) {
  var value, prop;
  for (prop in style) {
    value = style[prop] + "";
    if (!isNaN(value) && !unitlessProps[prop]) {
      value = value + unit;
    }
    style[prop] = value;
  }
  return style;
}


var style = document.createElement("div").style;
function supports(prop, value) {
  style[prop] = "";
  style[prop] = value;
  return !!style[prop];
}

function hyphenate(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-'+$0.toLowerCase(); });
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
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


// Expose constructor/factory.
var marcssist = Marcssist;

// For convenience, also expose the main method from an instance with the
// default options.
marcssist.style = marcssist().style;

if (typeof module !== "undefined" && typeof exports === "object") {
  // Simplified CommonJS/Node
  module.exports = marcssist;
} else {
  // Global
  window.marcssist = marcssist;
}

})();
