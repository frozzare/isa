(function (window) {

  var doc = window.document
    , html = doc.documentElement
    , byClass = 'getElementsByClassName'
    , byTag = 'getElementsByTagName'
    , byId = 'getElementById'
    , byAll = 'querySelectorAll'
    , nodeType = 'nodeType'
    , idExp = /^#([\w\-]*)$/
    , classExp = /^\.([\w\-]*)$/
    , tagNameExp = /^(?:[\w\-]+|\*)$/
    , tagNameWithoutEndExp = /^[\w\-]+/
    , tagNameAndOrIdAndOrClassExp = /^([\w\-]+)(?:\#([\w\-]*)|)(?:\.([\w\-]*))(.*)$/
    , tagNameAttributeExp = /^([\w\-]+)(.*)\[([\w\-]+)(?:(\=|\|\=|\~\=|\$\=|\^\=)(.*)|)\]$/
    , splittersExp = /([\s\>\<\+\~]+)/
    , whitespaceExp = /\s/g
    , hasQsa = !!doc[byAll]
    , slice = [].slice
    , _cache = {};

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

  function each (a, fn) {
    var i = 0, l = a.length;
    for (; i < l; i++) fn(a[i]);
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
   * Attribute selectors.
   *
   * Supported:
   *   =
   *   |=
   *   ~=
   *   $=
   *   ^=
   *
   * @param {Array} m
   * @param {Object} el
   *
   * @return {Bool}
   */

  function attributeSelectors (m, el) {
    var ret = false, val;

    switch (m[4]) {
      case '=':
        ret = el.getAttribute(m[3]) === m[5];
        break;
      case '|=':
        ret = (el.getAttribute(m[3]) || '').indexOf(m[5] + '-') !== -1;
        break;
      case '~=':
        ret = (el.getAttribute(m[3]) || '').indexOf(m[5]) !== -1;
        break;
      case '$=':
        val = (el.getAttribute(m[3]) || '');
        ret = val.lastIndexOf(m[5]) === val.length - m[5].length;
        break;
      case '^=':
        ret = (el.getAttribute(m[3]) || '').indexOf(m[5]) === 0;
    }

    return ret;
  }

  /**
   * Variation selectors.
   *
   * Supported:
   * - p + p
   * - p ~ p
   * - p > p
   *
   * @param {String} m
   * @param {Object} el
   * @param {Object} el2
   *
   * @return {Bool}
   */

  function variationSelectors (m) {
    var ret = false;

    return ret;
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
   * - div (tagname)
   * - p, a (comma separated selectors)
   * - a[href]
   * - a.internal[href]
   * - a[href=name]
   * - a[href^=he]
   * - a[lang|=en]
   * - a[href~=te]
   * - a[href$=.com]
   * - div > p
   * - div < p
   * - p + p
   * - p ~ p
   *
   * @param {String} sel The selector string
   * @param {Object} ctx The context. Default is document.
   * @param {Bool} c Save to cache? Default is true.
   */

  function isa (sel, ctx, c) {
    var m, els = [];

    // Get the right context to use.
    ctx = normalizeCtx(ctx);

    // If the selector is cached, why not used that? So mutch faster.
    if ((els = cache[sel]) !== undefined) {
      return els;
    }

    if (sel.indexOf(',') !== -1) {
      // Comma separated selectors. E.g $('p, a');
      els = els || [];
      each(sel.split(','), function (a) {
        each(isa(a.replace(whitespaceExp, '')), function (el) {
          els.push(el);
        });
      });
      return els; //(!c ? cache(sel, els) : els);
    } else {
      if (idExp.test(sel)) {
        els = hasQsa ? ctx[byAll](sel.substr(1)) : ((els = ctx[byId](sel.substr(1))) ? [els] : []);
      } else if ((m = classExp.exec(sel)) && ctx[byClass] !== undefined) {
        els = hasQsa ? ctx[byAll](m[1]) : ctx[byClass](m[1]);
      } else if (tagNameExp.test(sel)) {
        els = hasQsa ? ctx[byAll](sel) : ctx[byTag](sel);
      } else if ((m = tagNameAndOrIdAndOrClassExp.exec(sel))) {
        var fr = m.length === 4;
        els = els || [];
        each(ctx[byTag](m[1]), function (el) {
          if ((fr && el.getAttribute('id') === m[2] && (el.getAttribute('class') || '').indexOf(m[3]) !== -1) ||
          (el.getAttribute('id') === m[2] || (el.getAttribute('class') || '').indexOf(m[3]) !== -1)) {
            if (m[4] !== undefined) {
              // build a function that walks all the way to the bottom om the "extra" selectors string.
            } else {
              els.push(el);
            }
          }
        });
      } else if ((m = tagNameAttributeExp.exec(sel))) {
        els = els || [];
        each(isa(m[1]), function (el) {
          if (m[2] !== '') {
            var r = isa(m[1] + m[2]);
            for (var i = 0, l = r.length; i < l; i++) {
              if (el === r[i] && el.hasAttribute(m[3]) && (m[4] !== undefined ? attributeSelectors(m, el) : true)) {
                els.push(el);
                break;
              }
            }
          } else if (el.hasAttribute(m[3]) && (m[4] !== undefined ? attributeSelectors(m, el) : true)) {
            els.push(el);
          }
        });
      } else if ((m = splittersExp.exec(sel))) {
        sel = m[1].length > 2 ? sel = sel.replace(whitespaceExp, '') : sel;
        m = m[1].length > 2 ? m[1].replace(whitespaceExp, '') : m[1];
        els = els || [];
        var sels = sel.split(m), el = isa(sels[0]), tagName = (tagNameWithoutEndExp.exec(sels[1]) || [])[0];
        if ((el = el[0])) {
          if (m === '~') {
            each(isa(sels[1]), function (nextEl) {
              if (nextEl.parentNode === el.parentNode &&
                compareString(nextEl.tagName, tagName) &&
                comparePosition(el, nextEl) & 0x04) {
                  els.push(nextEl);
                }
            });
          } else if (m === '+') {
            each(isa(sels[1]), function (nextEl) {
              if (nextElementSibling(el) === nextEl) {
                els.push(nextEl);
              }
            });
          } else if (m === '>' || m === '<') {
            each(isa(sels[1]), function (child) {
              if ((child.parentNode === el && compareString(child.tagName, tagName)) ||
                (child === el && compareString(child.tagName, el.tagName))) {
                els.push(m === '>' ? child : el);
              }
            });
          } else if (m === ' ') {
            each(isa(sels[0]), function (ctx) {
              els = els.concat(filter(isa(sels[1], ctx, true), function (el) {
                return el && el !== html && el.parentNode;
              }));
            });
          }
        }
      }

      return els; //(!c ? cache(sel, els) : els)
    }
  }

  // Add `isa` to window object.
  window.isa = isa;

})(window);