/**
 * BeatBox JS
 * http://ianli.com/beatbox/
 *
 * Copyright 2010, Ian Li (http://ianli.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 *
 * Versions:
 * 0.3	2010-12-02
 * - Added clear()
 * 0.2	2010-12-02
 * - Fixed problem with IE not parsing pauses.
 * 0.1	2010-12-01
 * - Initial implementation.
 */

(function() {
	// Baseline setup
	// --------------

	// Establish the root object, `window` in the browser, or `global` on the server.
	var root = this;

	/**
	 * The class representing the set of beats.
	 * @class
	 */
	var Beats = function(start) {
		// Use self, so there is no confusion with what *this* is.
		var self = this;

		/* The set of pauses */
		var NO_PAUSE = this.NO_PAUSE = "|";
		var SHORT_PAUSE = this.SHORT_PAUSE = " ";
		var MEDIUM_PAUSE = this.MEDIUM_PAUSE = ",";
		var LONG_PAUSE = this.LONG_PAUSE = ".";

		/* Associative array of events */
		var events = {};

		/* Array of beats */
		var beats = [];

		/* Index of currently selected item
		 * -1 if nothing is selected.
		 */
		var selected_index = -1;

		/**
		 * Private method to set up
		 * @private
		 */
		var setup = function(start) {
			if (typeof start === "string") {
				setupFromString(start);
				clean();
			}
		}

		/**
		 * Private method to set up the beats from a string.
		 * @private
		 */
		var setupFromString = function(str) {
			/*
			var tokens = str.split(" ");
			// var tokens = str.split(/(\s+|\s*,\s*|\s*\|\s*)/ig);
			for (var i = 0, n = tokens.length; i < n; i++) {
				var token = tokens[i];
				self.add(token);
				// beats.push(token);
			}
			*/
			split(str, SHORT_PAUSE);
		}

		var split = function(str, separator) {
			var tokens = str.split(separator);
			for (var i = 0, n = tokens.length; i < n; i++) {
				var token = tokens[i];
				if (token.indexOf(NO_PAUSE) >= 0) {
					split(token, NO_PAUSE);
				} else if (token.indexOf(SHORT_PAUSE) >= 0) {
					split(token, SHORT_PAUSE);
				} else if (token.indexOf(MEDIUM_PAUSE) >= 0) {
					split(token, MEDIUM_PAUSE);
				} else if (token.indexOf(LONG_PAUSE) >= 0) {
					split(token, LONG_PAUSE);
				} else {
					self.add(token);
				}
				if (i < n - 1) {
					self.add(separator);
				}
			}
		}

		/**
		 * Cleans the array of beats.
		 * Removes pauses that are next to each other.
		 */
		var clean = function() {
			var clean_beats = [];
			for (var i = 0, n = beats.length; i < n; i++) {
				var beat = beats[i];
				var last_beat = (clean_beats.length == 0) ? null : clean_beats[clean_beats.length - 1];

				if (last_beat == null) {
					if (isPause(beat)) {
						// do nothing.
					} else {
						clean_beats.push(beat);
					}
				} else if (isPause(last_beat)) {
					if (isPause(beat)) {
						// Just replace the last beat.
						clean_beats[clean_beats.length - 1] = beat;
					} else {
						clean_beats.push(beat);
					}
				} else {
					// last_beat is NOT a pause.

					if (isPause(beat)) {
						clean_beats.push(beat);
					} else {
						if (i != 0) {
							clean_beats.push(NO_PAUSE);
						}
						clean_beats.push(beat)
					}
				}

				// If the current beat is selected...
				if (i == selected_index) {
					// ...then remember our position in the array of clean beats.
					var new_selected_index = (clean_beats.length == 0) ? 0 : clean_beats.length - 1;
				}
			}

			// Update the selected index.
			if (typeof new_selected_index === "undefined") {
				selected_index = clean_beats.length - 1;
			} else {
				selected_index = new_selected_index;
			}

			// Replace the old beats with the cleaned beats.
			beats = clean_beats;
		}

		/**
		 * Adds an event.
		 * @private
		 */
		var addEvent = function(name, fn) {
			if (typeof events[name] === 'undefined') {
				events[name] = [];
			}
			events[name].push(fn);
		}

		/**
		 * Fires the events associated with the name.
		 * @private
		 */
		var fireEvent = function(name) {
			if (typeof events[name] === 'undefined') {
				return;
			}

			var e = events[name];
			for (var i = 0, n = e.length; i < n; i++) {
				var fn = e[i];
				fn.call(this);
			}
		}

		/**
		 * Returns whether the beat is a pause.
		 * @private
		 */
		var isPause = function(beat) {
			return (beat == NO_PAUSE
				|| beat == SHORT_PAUSE
				|| beat == MEDIUM_PAUSE
				|| beat == LONG_PAUSE);
		}

		/**
		 * Adds the beat to the list of beats.
		 *
		 * If beat is a function, adds the function to the handlers called when a beat is added.
		 *
		 * @param {String|Function}	beat
		 * @returns {Beats}	This object for chaining.
		 */
		this.add = function(beat) {
			if (typeof beat === 'function') {
				addEvent("add", beat);
			} else {
				// Increment the selected index.
				selected_index++;
				if (isPause(beat) && isPause(beats[selected_index])) {
					beats.splice(selected_index, 1, beat);
				} else {
					beats.splice(selected_index, 0, beat);
				}

				clean();

				fireEvent("add");
			}
			return this;
		}

		/**
		 * Removes the beat at index.
		 *
		 * If index is a function, adds the function to the handlers called when a beat is removed.
		 *
		 * @param {String|Function}	index
		 * @returns {Beats}	This object for chaining.
		 */
		this.remove = function(index) {
			if (typeof index === 'function') {
				addEvent("remove", index);
			} else {
				selected_index = index;
				beats.splice(index, 1);
				clean();
				fireEvent("remove");
			}
			return this;
		}
		
		/**
		 * Clears the beats.
		 * @param {Function} [fn]	Optional function to handle event when clear() is called.
		 */
		this.clear = function() {
			if (arguments.length > 0 && typeof arguments[0] === 'function') {
				addEvent("clear", arguments[0]);
			} else {
				selected_index = -1;
				beats = [];
				fireEvent("clear");
			}
		}

		/**
		 * Selects the beat at index.
		 *
		 * If index is a function, adds the function to the handlers called when a beat is selected.
		 *
		 * @param {String|Function}	index
		 * @returns {Beats}	This object for chaining.
		 */
		this.select = function(index) {
			if (typeof index === 'function') {
				addEvent("select", index);
			} else {
				if (index >= 0 && index < beats.length) {
					selected_index = index;
					fireEvent("select");
				}
			}
			return this;
		}

		/**
		 * Returns the index of the selected beat.
		 * @returns {Number}	The index of the selected beat.
		 */
		this.selectedIndex = function() {
			return selected_index;
		}

		/**
		 * Iterate through the list of beats.
		 * For each beat, the function is called and passed two arguments: index and the beat.
		 * @param {Function}	The function to call for each element.
		 * @returns {Beats}	This object for chaining.
		 */
		this.each = function(fn) {
			for (var i = 0, n = beats.length; i < n; i++) {
				var value = beats[i];
				fn.call(this, i, value);
			}
			return this;
		}
		
		/**
		 * Returns the string representation of the beats.
		 * @returns {String}	String representation of the beats.
		 */
		this.toString = function() {
			var buffer = [];
			for (var i = 0, n = beats.length; i < n; i++) {
				var beat = beats[i];
				buffer.push(beat);
			}

			return buffer.join("");
		}
		
		/**
		 * Returns a representation of the beats that can be passed to Google Translate.
		 * @returns {String}
		 */
		this.toGoogle = function() {
			var buffer = [];
			for (var i = 0, n = beats.length; i < n; i++) {
				var beat = beats[i];
				if (beat === NO_PAUSE) {
					// do nothing.
				} else if (beat === SHORT_PAUSE){
					buffer.push(" ");
				} else if (beat === MEDIUM_PAUSE) {
					buffer.push(", ");
				} else if (beat === LONG_PAUSE) {
					buffer.push(". ");
				} else {
					buffer.push(beat);
				}
			}

			return buffer.join("");
		}
		
		/**
		 * Returns the length of these beats when entered into Google Translate.
		 * @returns {number}	The length of these beats according to Google Translate.
		 */
		this.googleLength = function() {
			var sum = 0;
			this.each(function(i, beat) {
				if (isPause(beat)) {
					if (beat == NO_PAUSE) {
						// do nothing.
					} else if (beat == SHORT_PAUSE) {
						sum += 1;
					} else {
						// beat == MEDIUM_PAUSE
						// beat == LONG_PAUSE
						sum += 2;
					}
				} else {
					sum += beat.length;
				}
			});
		}

		// Call setup
		if (arguments.length == 1) {
			setup(arguments[0]);
		} else {
			setup("");
		}
	}
	/* Current version of Beats */
	Beats.VERSION = {
		major: "0",
		minor: "3"
	};
	/* Version string */
	Beats.versionString = function() {
		return Beats.VERSION.major + "." + Beats.VERSION.minor;
	}

	// Expose Beats to the global scope.
	root.Beats = Beats;
})();