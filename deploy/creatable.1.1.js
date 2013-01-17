/** Write HTML without leaving Javascript land. Create DOM Elements with nestable arrays that reflect the structure of HTML.
	@author	Raine Lourie
	@note	Created independently from JsonML (http://jsonml.org).
 */

this.Creatable = (function() {
	
	/******************************************
	 * Regexes
	 ******************************************/
	var regexIdOrClassSeparator = new RegExp("[#.]");
	var regexIdOrClass = new RegExp("[#.][^#.]+", "g");

	/******************************************
	 * Functional
	 ******************************************/
	var map = function(arr, f) {
		var output = [];
		for(var i=0; i<arr.length; i++) {
			output.push(f(arr[i], i));
		}
		return output;
	};

	var each = function(arr, f) {
		for(var i=0; i<arr.length; i++) {
			f(arr[i], i);
		}
	};

	var eachObj = function(o, f) {
		var i=0;
		for(var attr in o) {
			f(attr, o[attr], i);
			i++;
		}
	};

	var filter = function(arr, f) {
		var output = [];
		for(var i=0; i<arr.length; i++) {
			if(f(arr[i], i)) {
				output.push(arr[i]);
			}
		}
		return output;
	};

	var find = function(arr, f) {
		for(var i=0; i<arr.length; i++) {
			if(f(arr[i])) {
				return arr[i];
			}
		}
		return null;
	};

	var extend = function(obj) {
		each(Array.prototype.slice.call(arguments, 1), function(source) {
			for (var prop in source) {
				if (source[prop] !== void 0) {
					obj[prop] = source[prop];
				}
			}
		});
		return obj;
	};

	var merge = function() {
		return extend.apply(this, [].concat({}, Array.prototype.slice.apply(arguments)));
	};

	var toObject = function(arr, f) {
		return extend.apply(arr, [{}].concat(map(arr, f)));
	};

	var keyValue = function(a, b) {
		var o = {};
		o[a] = b;
		return o;
	};

	var orderedGroup = function(arr, propOrFunc) {

		var getGroupKey = typeof(propOrFunc) == "function" ? 
			propOrFunc :
			function(item) { return item[propOrFunc]; };

		var results = [];
		var dict = {};
		for(var i=0; i<arr.length; i++) {
			var key = getGroupKey(arr[i]);
			if(!(key in dict)) {
				dict[key] = [];
				results.push({key: key, items: dict[key]});
			}
			dict[key].push(arr[i]);
		};

		return results;
	};

	/** Indexes into an array, supports negative indices. */
	var index = function(arr, i) {
		// one modulus to get in range, another to eliminate negative
		return arr[(i % arr.length + arr.length) % arr.length];
	};

	var pluck = function(arr, prop) {
		return map(arr, function(x) {
			return x[prop];
		});
	};

	var typeOf = function(value) {
		var s = typeof value;
		if (s === 'object') {
			if (value) {
				if (typeof value.length === 'number' &&
						!(value.propertyIsEnumerable('length')) &&
						typeof value.splice === 'function') {
					s = 'array';
				}
			} else {
				s = 'null';
			}
		}
		return s;
	};
	
	var curry = function(/*args...*/) {
		var fn = arguments[0];
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, 0)));
		};
	};

	var splitOnce = function(str, delim) {
		var components = str.split(delim);
		var result = [components.shift()];
		if(components.length) {
			result.push(components.join(delim));
		}
		return result;
	};

	// public interface
	return {

		/** Creates a DOM element. Supported objects are defined in the Creatable.types array. */
		create: function(arg) {
			var match = find(Creatable.types, function(creatable) { return creatable.isOfType(arg); });
			return match ? match.build(arg) : Creatable.error("Unbuildable create argument: " + arg);
		},

		/** A list of objects that the create function can create DOM elements from. */
		types: [
			// array
			{
				isOfType: function(o) { return Creatable.isMarkupArray(o); },
				build: function(o) { return Creatable.parseMarkupArray(o); }
			},
			// content
			{
				isOfType: function(o) { return typeof o === "string" || typeof o === "number"; },
				build: function(o) { return document.createTextNode(o); }
			},
			// null or undefined
			{
				isOfType: function(o) { return !Creatable.isValue(o); },
				build: function(o) { return null; }
			},
			// DOM node
			{
				isOfType: function(o) { return Creatable.isDomNode(o); },
				build: function(o) { return o; }
			},
			// jQuery
			{
				isOfType: function(o) { return typeof(jQuery) !== "undefined" && o instanceof jQuery; },
				build: function(o) { return o[0]; }
			}
		],

		plugins: {
			// insert content as unescaped HTML with { html: true }
			html: function(el, html) {
				if(html) {
					el.innerHTML = el.firstChild.nodeValue;
				}
			}
		},

		/******************************************
		 * Parsing Functions
		 ******************************************/

		/** Parses the given markup array and returns a newly created element. */
		parseMarkupArray: function(sexp) {

			var attrsOmitted = typeOf(sexp[1]) !== "object";

			var tagInput = sexp[0];
			var attrs = !attrsOmitted ? sexp[1] : {};
			var children = sexp[attrsOmitted ? 1 : 2];

			// split the tag input by spaces to extract descendants
			var tags = splitOnce(tagInput, " ");
			var tagNameString = tags[0];
			var descendantTags = tags[1];
			
			if(descendantTags) {
				children = [[descendantTags, attrs, children]];
				attrs = {};
			}

			// create the element and parse its attributes and children
			var element = tagNameString == "fragment" ?
				document.createDocumentFragment() : 
				document.createElement(Creatable.parseTagName(tagNameString));
			
			// queue custom attribute plugins. they aren't executed immediately because we need to remove the plugin attributes and add the children and normal attributes
			var pluginActions = [];
			eachObj(Creatable.plugins, function(pluginAttr, f) {
				if(pluginAttr in attrs) {
					if(attrs[pluginAttr]) {
						pluginActions.push(curry(f, element, attrs[pluginAttr]));
					}
					delete attrs[pluginAttr];
				}
			});

			var selectorAttrs = Creatable.parseSelectorAttributes(tagNameString);
			Creatable.addAttributes(element, Creatable.mergeAttributes(attrs, selectorAttrs));
			Creatable.addChildren(element, Creatable.isValue(children) ? children : []);

			// exucute the attribute plugins
			each(pluginActions, function(f) { f(); });

			return element;
		},

		/** Returns the tag name from a tag name string that could have CSS selector syntax. */
		parseTagName: function(tagNameString) {
			return tagNameString.split(regexIdOrClassSeparator)[0] || "div";
		},

		/** Parses the tagName for CSS selector syntax and returns an object of attribute names and values. */
		parseSelectorAttributes: function(tagNameString) {

			var attrMap = { "#" : "id", "." : "class" };
			var afterSep = tagNameString.substring(tagNameString.indexOf(regexIdOrClassSeparator));
			var selectors = afterSep.match(regexIdOrClass) || [];

			// transform the list of selector strings to a list of objects so that they can be grouped by attribute
			var selObjects = map(selectors, function(sel) { return { sep: attrMap[sel[0]], name: sel.substring(1) }; });

			// group the same selectors together so that a final attribute value can be determined from multiples, then convert the groups into a single object to be returned as the attribute .
			return toObject(orderedGroup(selObjects, "sep"), function(g) { 
				return keyValue( 
					g.key, 
					// joins duplicate classes with a space, otherwise just uses the last value
					g.key === "class" ? pluck(g.items, "name").join(" ") : index(g.items, -1).name
				);
			});
		},

		/** Parses the attributes and adds them to the element. */
		addAttributes: function(element, attrs) {
			for(attr in attrs) {
				if(Creatable.isValue(attrs[attr])) {
					element.setAttribute(attr, attrs[attr]);
				}
			}
		},

		/** Returns true if the given class value string contains the given class. */
		containsClass: function(str, className) {
			return str && (" " + str + " ").indexOf(" " + className + " ") > -1;
		},

		/** Adds the given className to the element's class attribute. */
		addClass: function(element, className) {
			element.setAttribute("class", element.hasAttribute("class") ? element.getAttribute("class") + " " + className : className);
		},

		/** Adds the given children to the element. */
		addChildren: function(element, children) {

			if(typeof children === "string" || typeof children === "number") {
				children = [children];
			}

			if(children instanceof Array) {
				for(var i=0; i<children.length; i++) {
					var child = children[i];
					if(Creatable.isValue(child)) {
						element.appendChild(create(child));
					}
				};
			}
			else {
				Creatable.error("Invalid third parameter (content). Must be a string or number to use as text content or an array of nested elements.");
			}
		},

		/******************************************
		 * Helper Functions
		 ******************************************/
		
		/** Returns true if the object is not equal to null or undefined. */
		isValue: function(obj) {
			return obj !== null && obj !== undefined;
		},

		/** Returns true if the given object seems to be a DomNode. */
		isDomNode: function(node) {
			return node && typeof node.nodeType == "number";
		},
		
		/** Returns true if the given object is a valid markup array. */
		isMarkupArray: function(arr) {
			return arr instanceof Array;
				// omit further tests for performance.
			   //arr.length >= 1 && arr.length <= 3 &&	// 1, 2, or 3 items
			   //typeof arr[0] === "string"				// tagname is a string
		},

		mergeAttributes: function(a, b) {

			var uniqueClass = function(singleClass) { 
				return !Creatable.containsClass(a["class"], singleClass); 
			};

			var output = {};
			for(var aProp in a) {
				output[aProp] = a[aProp];
			}
			for(var bProp in b) {
				output[bProp] = b[bProp];
			}

			// merge class attributes
			output["class"] = a["class"] && b["class"] ? 
				[].concat(a["class"], filter(b["class"].split(" "), uniqueClass)).join(" ") :
				a["class"] || b["class"];

			return output;
		},

		/******************************************
		 * Error Handling
		 ******************************************/
		/** Abstracts the error handling for Creatable so that we can substitute a different handler if necessary. */
		error: function(message) {
			throw new Error(message || "ERROR");
		}
	};
})();

// add create into the global namespace
this.create = Creatable.create;
