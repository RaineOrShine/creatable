// Generated by CoffeeScript 1.4.0

/*
Elegant HTML generation. No templating. Just Javascript.
@author Raine Lourie
@note Created independently from JsonML (http://jsonml.org).
*/


(function() {
  var DocumentFragment, Element, Encoder, TextNode, addAttributes, addChildren, containsClass, create, createFromMarkupArray, createHtml, curry, document, each, eachObj, emulatedDocument, encoder, error, extend, filter, find, index, isDomNode, keyValue, map, mergeAttributes, orderedGroup, parseSelectorAttributes, parseTagName, plugins, regexIdOrClass, regexIdOrClassSeparator, render, setDocument, setEmulatedDocument, splice, splitOnce, toObject, typeOf, types,
    __slice = [].slice;

  if (typeof require !== "undefined" && require !== null) {
    Encoder = require('node-html-encoder').Encoder;
    encoder = new Encoder('entity');
  }

  /*
  DOM Emulation
  */


  TextNode = (function() {

    function TextNode(textContent) {
      this.textContent = textContent;
      this.nodeType = 3;
    }

    TextNode.prototype.toString = function() {
      return (typeof require !== "undefined" && require !== null) && encoder.htmlEncode(this.textContent) || this.textContent;
    };

    return TextNode;

  })();

  DocumentFragment = (function() {

    function DocumentFragment() {
      this.nodeType = 11;
      this.children = [];
    }

    DocumentFragment.prototype.appendChild = function(child) {
      if (this.children.length === 0) {
        this.firstChild = child;
      }
      return this.children.push(child);
    };

    DocumentFragment.prototype.toString = function() {
      var i, output;
      output = "";
      i = 0;
      while (i < this.children.length) {
        output += this.children[i].toString();
        i++;
      }
      return output;
    };

    return DocumentFragment;

  })();

  Element = (function() {

    function Element(tagName) {
      this.tagName = tagName;
      this.attributes = {};
      this.children = [];
      this.nodeType = 1;
    }

    Element.prototype.hasAttribute = function(attrName) {
      return attrName in this.attributes;
    };

    Element.prototype.getAttribute = function(name) {
      return this.attributes[name];
    };

    Element.prototype.setAttribute = function(name, value) {
      this.attributes[name] = value;
      return value;
    };

    Element.prototype.removeChild = function(child) {
      return console.error("Not implemented.");
    };

    Element.prototype.appendChild = function(child) {
      if (this.children.length === 0) {
        this.firstChild = child;
      }
      return this.children.push(child);
    };

    Element.prototype.toString = function() {
      var attr, i, output;
      output = "<" + this.tagName;
      for (attr in this.attributes) {
        output += " " + attr + "=\"" + this.attributes[attr] + "\"";
      }
      output += ">";
      i = 0;
      while (i < this.children.length) {
        output += this.children[i].toString();
        i++;
      }
      output += "</" + this.tagName + ">";
      return output;
    };

    return Element;

  })();

  /* 
  A lightweight emulation of the document object. Can be used to render creatable markup as an HTML string instead of a DOM node.
  */


  emulatedDocument = {
    createTextNode: function(content) {
      return new TextNode(content);
    },
    createDocumentFragment: function() {
      return new DocumentFragment();
    },
    createElement: function(tagName) {
      return new Element(tagName);
    },
    body: new Element("body"),
    toString: function() {
      return this.body.toString();
    }
  };

  document = this.document || emulatedDocument;

  setDocument = function(doc) {
    return document = doc;
  };

  setEmulatedDocument = function(doc) {
    return document = emulatedDocument;
  };

  /*
  Regexes
  */


  regexIdOrClassSeparator = new RegExp("[#.]");

  regexIdOrClass = new RegExp("[#.][^#.]+", "g");

  /*
  Private
  */


  map = function(arr, f) {
    var i, output;
    output = [];
    i = 0;
    while (i < arr.length) {
      output.push(f(arr[i], i));
      i++;
    }
    return output;
  };

  each = function(arr, f) {
    var i, _results;
    i = 0;
    _results = [];
    while (i < arr.length) {
      f(arr[i], i);
      _results.push(i++);
    }
    return _results;
  };

  eachObj = function(o, f) {
    var attr, i, _results;
    i = 0;
    _results = [];
    for (attr in o) {
      f(attr, o[attr], i);
      _results.push(i++);
    }
    return _results;
  };

  filter = function(arr, f) {
    var i, output;
    output = [];
    i = 0;
    while (i < arr.length) {
      if (f(arr[i], i)) {
        output.push(arr[i]);
      }
      i++;
    }
    return output;
  };

  find = function(arr, f) {
    var i;
    i = 0;
    while (i < arr.length) {
      if (f(arr[i])) {
        return arr[i];
      }
      i++;
    }
    return null;
  };

  extend = function() {
    var args, obj;
    obj = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    each(args, function(source) {
      var prop, _results;
      _results = [];
      for (prop in source) {
        if (source[prop] !== void 0) {
          _results.push(obj[prop] = source[prop]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
    return obj;
  };

  toObject = function(arr, f) {
    var x;
    return extend.apply(null, [{}].concat(__slice.call((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        x = arr[_i];
        _results.push(f(x));
      }
      return _results;
    })())));
  };

  keyValue = function(a, b) {
    var o;
    o = {};
    o[a] = b;
    return o;
  };

  orderedGroup = function(arr, propOrFunc) {
    var dict, getGroupKey, i, key, results;
    getGroupKey = (typeof propOrFunc === "function" ? propOrFunc : function(item) {
      return item[propOrFunc];
    });
    results = [];
    dict = {};
    i = 0;
    while (i < arr.length) {
      key = getGroupKey(arr[i]);
      if (!(key in dict)) {
        dict[key] = [];
        results.push({
          key: key,
          items: dict[key]
        });
      }
      dict[key].push(arr[i]);
      i++;
    }
    return results;
  };

  /*
  Indexes into an array, supports negative indices.
  */


  index = function(arr, i) {
    return arr[(i % arr.length + arr.length) % arr.length];
  };

  typeOf = function(value) {
    var s;
    s = typeof value;
    if (s === "object") {
      if (value) {
        if (typeof value.length === "number" && !(value.propertyIsEnumerable("length")) && typeof value.splice === "function") {
          s = "array";
        }
      } else {
        s = "null";
      }
    }
    return s;
  };

  curry = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return function() {
      var args2;
      args2 = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return fn.apply(this, args.concat(args2));
    };
  };

  splitOnce = function(str, delim) {
    var components, result;
    components = str.split(delim);
    result = [components.shift()];
    if (components.length) {
      result.push(components.join(delim));
    }
    return result;
  };

  /*
  Functional, nondestructive version of Array.prototype.splice.
  */


  splice = function() {
    var arr, elements, elementsLen, howMany, i, index, len, results;
    arr = arguments[0], index = arguments[1], howMany = arguments[2], elements = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    results = [];
    len = arr.length;
    i = 0;
    while (i < index && i < len) {
      results.push(arr[i]);
      i++;
    }
    i = 0;
    elementsLen = elements.length;
    while (i < elementsLen) {
      results.push(elements[i]);
      i++;
    }
    i = index + howMany;
    while (i < len) {
      results.push(arr[i]);
      i++;
    }
    return results;
  };

  /*
  Public
  */


  /*
  Creates a DOM element. Supported objects are defined in the types array.
  */


  create = function(arg, doc) {
    var match;
    if (doc == null) {
      doc = document || emulatedDocument;
    }
    match = find(types, function(creatable) {
      return creatable.isOfType(arg);
    });
    if (match) {
      return match.build(arg, doc);
    } else {
      return error("Unbuildable create argument: " + arg, arg);
    }
  };

  createHtml = function(arg) {
    return create(arg, emulatedDocument).toString();
  };

  /*
  A list of objects that the create function can create DOM elements from.
  In order of most to least common.
  */


  types = [
    {
      isOfType: function(o) {
        return o instanceof Array && o.length && typeof o[0] === 'string';
      },
      build: function(o, doc) {
        return createFromMarkupArray(o, doc);
      }
    }, {
      isOfType: function(o) {
        return typeof o === "string" || typeof o === "number";
      },
      build: function(o, doc) {
        return doc.createTextNode(o);
      }
    }, {
      isOfType: function(o) {
        return typeof o === "function";
      },
      build: function(o, doc) {
        return o(doc);
      }
    }, {
      isOfType: function(o) {
        return !(o != null);
      },
      build: function(o) {
        return o;
      }
    }, {
      isOfType: function(o) {
        return isDomNode(o);
      },
      build: function(o) {
        return o;
      }
    }, {
      isOfType: function(o) {
        return typeof jQuery !== "undefined" && o instanceof jQuery;
      },
      build: function(o) {
        return o[0];
      }
    }, {
      isOfType: function(o) {
        return o instanceof Array && (!o.length || o[0] instanceof Array);
      },
      build: function(o, doc) {
        var child, fragment, _i, _len;
        fragment = doc.createDocumentFragment();
        for (_i = 0, _len = o.length; _i < _len; _i++) {
          child = o[_i];
          fragment.appendChild(create(child, doc));
        }
        return fragment;
      }
    }
  ];

  plugins = {
    html: function(el, html) {
      if (html && el.firstChild) {
        return el.innerHTML = el.firstChild.nodeValue;
      }
    }
    /*
    Parsing Functions
    */

    /*
    Parses the given markup array and returns a newly created element.
    */

  };

  createFromMarkupArray = function(markup, doc) {
    var attrs, attrsOmitted, children, descendantTags, element, pluginActions, selectorAttrs, tagInput, tagName, tagNameString, tags;
    attrsOmitted = typeOf(markup[1]) !== "object";
    tagInput = markup[0];
    attrs = (!attrsOmitted ? markup[1] : {});
    children = markup[(attrsOmitted ? 1 : 2)];
    tags = splitOnce(tagInput, " ");
    tagNameString = tags[0];
    descendantTags = tags[1];
    if (descendantTags) {
      children = [[descendantTags, attrs, children]];
      attrs = {};
    }
    element = void 0;
    try {
      tagName = parseTagName(tagNameString);
      element = doc.createElement(tagName);
    } catch (e) {
      error("Invalid tag name: " + tagName, markup);
    }
    pluginActions = [];
    eachObj(plugins, function(pluginAttr, f) {
      if (pluginAttr in attrs) {
        if (attrs[pluginAttr]) {
          pluginActions.push(curry(f, element, attrs[pluginAttr]));
        }
        return delete attrs[pluginAttr];
      }
    });
    selectorAttrs = parseSelectorAttributes(tagNameString);
    addAttributes(element, mergeAttributes(attrs, selectorAttrs));
    if (children != null) {
      addChildren(element, children, doc);
    }
    each(pluginActions, function(f) {
      return f();
    });
    return element;
  };

  /*
  Returns the tag name from a tag name string that could have CSS selector syntax.
  */


  parseTagName = function(tagNameString) {
    return tagNameString.split(regexIdOrClassSeparator)[0] || "div";
  };

  /*
  Parses the tagName for CSS selector syntax and returns an object of attribute names and values.
  */


  parseSelectorAttributes = function(tagNameString) {
    var afterSep, attrMap, selObjects, selectors;
    attrMap = {
      "#": "id",
      ".": "class"
    };
    afterSep = tagNameString.substring(tagNameString.indexOf(regexIdOrClassSeparator));
    selectors = afterSep.match(regexIdOrClass) || [];
    selObjects = map(selectors, function(sel) {
      return {
        sep: attrMap[sel[0]],
        name: sel.substring(1)
      };
    });
    return toObject(orderedGroup(selObjects, "sep"), function(g) {
      var item;
      return keyValue(g.key, (g.key === "class" ? ((function() {
        var _i, _len, _ref, _results;
        _ref = g.items;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.name);
        }
        return _results;
      })()).join(" ") : index(g.items, -1).name));
    });
  };

  /*
  Parses the attributes and adds them to the element.
  */


  addAttributes = function(element, attrs) {
    var attr, _results;
    _results = [];
    for (attr in attrs) {
      if (attr === "checked" || attr === "disabled" || attr === "selected") {
        if (attrs[attr]) {
          _results.push(element.setAttribute(attr, attr));
        } else {
          _results.push(void 0);
        }
      } else {
        if (attrs[attr] != null) {
          _results.push(element.setAttribute(attr, attrs[attr]));
        } else {
          _results.push(void 0);
        }
      }
    }
    return _results;
  };

  /*
  Returns true if the given class value string contains the given class.
  */


  containsClass = function(str, className) {
    return str && (" " + str + " ").indexOf(" " + className + " ") > -1;
  };

  /*
  Adds the given children to the element.
  */


  addChildren = function(node, children, doc) {
    var child, _i, _len, _results;
    if (typeof children === "string" || typeof children === "number") {
      children = [children];
    }
    _results = [];
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      if (child != null) {
        _results.push(node.appendChild(create(child, doc)));
      }
    }
    return _results;
  };

  /*
  Helper Functions
  */


  /*
  Returns true if the given object seems to be a DomNode.
  */


  isDomNode = function(node) {
    return node && typeof node.nodeType === "number";
  };

  mergeAttributes = function(a, b) {
    var aProp, bProp, output, uniqueClass;
    uniqueClass = function(singleClass) {
      return !containsClass(a["class"], singleClass);
    };
    output = {};
    for (aProp in a) {
      output[aProp] = a[aProp];
    }
    for (bProp in b) {
      output[bProp] = b[bProp];
    }
    output["class"] = (a["class"] && b["class"] ? [].concat(a["class"], filter(b["class"].split(" "), uniqueClass)).join(" ") : a["class"] || b["class"]);
    return output;
  };

  /*
  Error Handling
  */


  /*
  Abstracts the error handling for Creatable so that we can substitute a different handler if necessary.
  */


  error = function(message, params) {
    if (params) {
      console.error(params);
    }
    throw new Error(message || "ERROR");
  };

  /*
  Render Helper
  */


  render = function(markup) {
    var body;
    body = document.body;
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    return body.appendChild(create(markup));
  };

  extend((typeof exports !== "undefined" && exports !== null) && exports || (this.Creatable = {}), {
    emulatedDocument: emulatedDocument,
    setDocument: setDocument,
    TextNode: TextNode,
    Element: Element,
    DocumentFragment: DocumentFragment,
    create: create,
    createHtml: createHtml,
    types: types,
    plugins: plugins,
    createFromMarkupArray: createFromMarkupArray,
    parseTagName: parseTagName,
    parseSelectorAttributes: parseSelectorAttributes,
    addAttributes: addAttributes,
    containsClass: containsClass,
    isDomNode: isDomNode,
    mergeAttributes: mergeAttributes,
    error: error,
    render: render
  });

}).call(this);
