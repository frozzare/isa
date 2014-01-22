/*!
 * isa.js
 * Copyright (c) 2014 Fredrik Forsmo
 * Version: 0.1.0
 * Released under the MIT License.
 *
 * Date: 2014-01-22
 */

(function (window) {

  var doc = window.document
    , html = doc.documentElement
    , byClass = 'getElementsByClassName'
    , byTag = 'getElementsByTagName'
    , byId = 'getElementById'
    , byAll = 'querySelectorAll'
    , nodeType = 'nodeType'
    , idClassTagNameExp = /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/
    , idExp = /^#([\w\-]*)$/
    , classExp = /^\.([\w\-]*)$/
    , tagNameExp = /^(?:[\w\-]+|\*)$/
    , tagNameAndOrIdAndOrClassExp = /^(\w+)(?:#([\w-]+)|)(?:\.([\w-]+)|)$/
    , tagNameAttributeExp = /^([\w\-]+)(.*)\[([\w\-]+)(?:(\=|\|\=|\~\=|\$\=|\^\=|\*\=)(.*)|)\]$/
    , splittersExp = /([\s\>\\<\+\~]+)/
    , whitespaceExp = /\s/g
    , breaker = {}

    // Prototype references.
    , ArrayProto = Array.prototype

    // Create reference for speeding up the access to the prototype.
    , slice = ArrayProto.slice
    , concat = ArrayProto.concat

    // Native functions that we are using.
    , nativeIndexOf = ArrayProto.indexOf
    , nativeLastIndeOf = ArrayProto.lastIndexOf

    ;

  /**
   * An object used to flag environments/features.
   */
  
  var support = {};
  
  (function () {
  
    /**
     * Detect getElementsByClassName support.
     */
  
    support.byClass = !!doc[byClass];
  
    /**
     * Detect querySelectorAll support.
     */
  
    support.byAll = !!doc[byAll];
  
    /**
     * Detect classList support.
     */
  
     support.classList = !!doc.createElement('p').classList;
  
  }());

  /**
   * Compare string that it's the same.
   *
   * @return {Bool}
   */
  
  function compareString (a, b) {
    return a.toLowerCase() === b.toLowerCase();
  }
  
  /**
   * Simple way to cache objects.
   *
   * @return {Object}
   */
  
  function cache (sel, els, c) {
    return !c ? _cache[sel] || (_cache[sel] = els) : els;
  }
  
  /**
   * Each function.
   *
   * @param {Array} a
   * @param {Function} fn
   */
  
  function each (obj, fn) {
    // native is slow and the value is enough for us as argument.
    //if (nativeForEach && a.forEach === nativeForEach) {
    //  return a.forEach(fn);
    //} else {
    var i = 0, l = obj.length;
    for (; i < l; i++) fn(obj[i]);
    //}
  }
  
  /**
   * Filter array.
   *
   * @param {Array} a
   * @param {Function} fn
   *
   * @return {Array}
   */
  
  function filter (a, fn) {
    var res = [];
    each(a, function (x) {
      if (fn(x)) res.push(x);
    });
    return res;
  }
  
  /**
   * Determine if the array or object contains a given value.
   *
   * @param {Array} obj
   * @param {Object} target
   *
   * @return {Boolean}
   */
  
  function contains (obj, target) {
    if (obj === null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) !== -1;
    var result = false;
    each(obj, function (value) {
      if (result || (result = value === target)) return breaker;
    });
    return result;
  }

  /**
   * Compare position of elements.
   * MIT Licensed, John Resig.
   *
   * @param {Object} a
   * @param {Object} b
   *
   * @return {Bool}
   */
  
  function comparePosition (a, b){
    return a.compareDocumentPosition ?
      a.compareDocumentPosition(b) :
      a.contains ?
        (a != b && a.contains(b) && 16) +
          (a != b && b.contains(a) && 8) +
          (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
            (a.sourceIndex < b.sourceIndex && 4) +
              (a.sourceIndex > b.sourceIndex && 2) :
            1) +
        0 :
        0;
  }
  
  /**
   * Find next element sibiling.
   *
   * @param {Object} el
   *
   * @return {Object}
   */
  
  function nextElementSibling (el) {
      if (el.nextElementSibling) {
        return el.nextElementSibling;
      } else {
        while (el = el.nextSibling) {
          if (el[nodeType] !== 1) return el;
        }
      }
  }
  
  /**
   * Find previous element sibling.
   *
   * @param {Object} el
   *
   * @return {Object}
   */
  
  function previousElementSibling (el) {
    if (el.previousElementSibling) {
      return el.previousElementSibling;
    } else {
      while (el = el.previousSibling) {
        if (el[nodeType] === 1) return el;
      }
    }
  }
  
  /**
   * Determine if the element contains the klass.
   * Uses the `classList` api if it's supported.
   * https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
   *
   * @param {Object} el
   * @param {String} klass
   *
   * @return {Array}
   */
  
  function containsClass (el, klass) {
    if (support.classList) {
      return el.classList.contains(klass);
    } else {
      return contains(('' + el.className).split(' '), klass);
    }
  }
  

  /**
   * Normalize context.
   *
   * @param {String|Array} ctx
   *
   * @return {Object}
   */
  
  function normalizeCtx (ctx) {
    if (!ctx) return doc;
    if (typeof ctx === 'string') return isa(ctx)[0];
    if (!ctx[nodeType] && ctx instanceof Array) return ctx[0];
    if (ctx[nodeType]) return ctx;
  }
  
  /**
   * Find elements by selectors.
   *
   * Supported:
   * - #foo
   * - .foo
   * - div
	 * - ul#foo.foo (combo)
	 *
   *
   * @param {String} sel The selector string
   * @param {Object} ctx The context. Default is document.
   * @param {Bool} c Save to cache? Default is true.
   */
  
  function isa (sel, ctx) {
    var m, nodeType, tmp, els = [];
  
    // Get the right context to use.
    ctx = normalizeCtx(ctx);
  
    // Can't process non string selectors right now.
    if (typeof sel !== 'string') {
      return els;
    }
  
    if ((nodeType = ctx.nodeType) !== 1 && nodeType !== 9) {
      return els;
    }
  
    // Split selectors by comma if it's exists.
    if (sel.indexOf(',') !== -1) {
      // Comma separated selectors. E.g $('p, a');
      els = els || [];
      each(sel.split(','), function (a) {
        each(isa(a.replace(whitespaceExp, '')), function (el) {
          els.push(el);
        });
      });
      return els;
    }
  
    if (m = idClassTagNameExp.exec(sel)) {
      if ((sel = m[1])) {
        els = ((els = ctx[byId](sel))) ? [els] : [];
      } else if ((sel = m[2])) {
        els = support.byClass ? ctx[byClass](sel) : support.byAll ? ctx[byAll](m[2]) : [];
      } else if ((sel = m[3])) {
        els = ctx[byTag](sel);
      }
    } else if (m = tagNameAndOrIdAndOrClassExp.exec(sel)) {
      var result = ctx[byTag](m[1])
        , id = m[2]
        , className = m[3];
  
      each(result, function (el) {
        if (el.id === id || containsClass(el, className)) els.push(el);
      });
    }
  
    return els;
  }

  // use square bracket notation so Closure Compiler won't munge `isa`
  // http://code.google.com/closure/compiler/docs/api-tutorial3.html#export
  window['isa'] = isa;

})(window);
