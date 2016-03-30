// Scooter v1.0.0 - Maps functionality for your HTML | Joshua Woehlke | github.com/userexec/scooter | Licensed MIT */

(function() {

	if (!window.scooter) {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	/////////
	////////
	///////		Init
	//////			- Config sanitization and defaults
	/////			- Calls to append elements and attach listeners
	////            - Return show object (only data unique to specific show)
	///
	//

		window.scooter = function(config) {
			
			// Create default configs where none provided
			config = config || {};
			config.plate = config.plate || false;
			config.insertInto = config.insertInto || config.plate.parent();
			config.viewportWidth = config.viewportWidth || '100%';
			config.viewportHeight = config.viewportHeight || '100%';
			config.viewportBackground = config.viewportBackground || 'linear-gradient(to bottom, #b8c6df 0%,#6d88b7 100%)';
			config.initialScale = config.initialScale || 1;
			config.animations = config.animations || {};
			config.maxZoom = config.maxZoom || 4;
			config.minZoom = config.minZoom || 1;
			config.pan = config.pan || true;
			config.startAt = config.startAt || 'origin';
			config.targets = config.targets || false;

			// Return false if no plate
			if (!config.plate) {

				console.log('Scooter - Config error: No plate specified. Please pass a jQuery object.');
				return false;

			}

			// Explicitly set advanced trigger values to false if not otherwise specified
			if (!!config.targets) {
				for (var trigger in config.targets) {
					if (typeof config.targets[trigger] === 'object') {
						config.targets[trigger].duration = config.targets[trigger].duration || false;
						config.targets[trigger].easing = config.targets[trigger].easing || false;
						config.targets[trigger].scale = config.targets[trigger].scale || false;
						config.targets[trigger].travelScale = config.targets[trigger].travelScale || false;
						config.targets[trigger].scaleDuration = config.targets[trigger].scaleDuration || false;
						config.targets[trigger].callback = config.targets[trigger].callback || false;
					}
				}
			}

			// Build the show object
			var show = {
				id: Math.floor(Math.random() * 1000000),
				config: config,
				elements: {},
				state: {
					currentTarget: 'center',
					currentScale: config.initialScale,
					waypoints: []
				},
				trigger: function(trigger) {

					var target;

					if (!!this.config.targets[trigger]) {
						
						if (typeof this.config.targets[trigger] === 'string' || typeof this.config.targets[trigger] === 'function') {
							
							// If the target is returned from a function, resolve it now
							if (typeof this.config.targets[trigger] === 'function') {
								target = this.config.targets[trigger]();
							} else {
								target = this.config.targets[trigger];
							}

							scooter.movement.scootTo(this, {target: target});

						} else if (typeof show.config.targets[trigger] === 'object') {
							
							// If the target is returned from a function, resolve it now
							if (typeof this.config.targets[trigger].target === 'function') {
								target = this.config.targets[trigger].target();
							} else {
								target = this.config.targets[trigger].target;
							}

							scooter.movement.scootTo(this, this.config.targets[trigger]);

						}

					}
				}
			};

			// Append elements
			scooter.actions.appendElements(show);

			// Attach targets
			scooter.actions.attachTargets(show);

			// Attach events
			scooter.actions.attachEvents(show);

			// Scoot to startAt
			if (config.startAt !== 'origin') {
				scooter.movement.scootTo(show, {
					target: config.startAt,
					scale: 1,
					duration: 0
				});
			}

			return show;

		}


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	/////////
	////////
	///////		Actions
	//////			- Appending elements (viewport, scaler, specified plate)
	/////			- Mouse and touch event listeners
	////			- One-time attachment of listeners from targets object
	///
	//

		scooter.actions = {

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////            Append elements on init          /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			appendElements: function(show) {

				// Ensure a positioning has been specified on the parent of the viewport (unless body)
				var parentPosition = show.config.insertInto.css('position');
				if (show.config.insertInto.prop('tagName') !== 'BODY' && parentPosition !== 'absolute' && parentPosition !== 'fixed') {

					// Viewport will be absolute, so insertInto uses at minimum relative positioning
					// This also ensures overflow does not occur in cases where it's specified hidden but parent has static positioning
					show.config.insertInto.css('position', 'relative');

				}

				// Append viewport to insertInto
				$('<div></div>', {
					id: 'scooter-viewport-' + show.id,
				}).css({
					width: show.config.viewportWidth,
					height: show.config.viewportHeight,
					background: show.config.viewportBackground,
					position: 'absolute',
					top: '0',
					left: '0',
					overflow: 'hidden',
					'-webkit-touch-callout': 'none',
					'-webkit-user-select': 'none',
					'-khtml-user-select': 'none',
					'-moz-user-select': 'none',
					'-ms-user-select': 'none',
					'user-select': 'none'
				}).appendTo(show.config.insertInto);

				// Save reference to viewport
				show.elements.viewport = $('#scooter-viewport-' + show.id);

				// Append scaler to viewport (overflow explicitly allowed)
				$('<div></div>', {
					id: 'scooter-scaler-' + show.id,
				}).css({
					width: show.config.viewportWidth,
					height: show.config.viewportHeight,
					overflow: 'visible'
				}).appendTo(show.elements.viewport);

				// Save reference to scaler
				show.elements.scaler = $('#scooter-scaler-' + show.id);

				// Append plate to scaler
				var plateId = '';
				show.config.plate.attr('id') ? plateId = show.config.plate.attr('id') : plateId = 'scooter-plate-' + show.id;
				show.config.plate.attr('id', plateId);
				show.config.plate.appendTo(show.elements.scaler);

				// Save reference to plate
				show.elements.plate = $('#' + plateId);

				// Ensure that the plate has at least relative positioning
				var platePosition = show.elements.plate.css('position');
				if (platePosition !== 'absolute') {
					show.elements.plate.css('position', 'relative');
				}

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////         Attach touch and mouse events       /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			attachEvents: function(show) {

				// Allow panning on the plate (default) for mice
				if (show.config.pan) {

					show.elements.plate.on('mousedown', function(event) {

						// Save a reference to where the pan started on the viewport
						// offsetX/Y is undefined in older firefox--use pageX/Y instead
						// References to pageX/Y will need to be overwritten on each mousemove, unlike offsetX/Y
						show.state.dragXStart = event.offsetX || event.pageX;
						show.state.dragYStart = event.offsetY || event.pageY;

						show.elements.viewport.on('mousemove', function(e) {

							// On a mousemove, immediately stop any active animations
							show.elements.plate.stop();

							// Call a drag animation
							scooter.movement.drag(e, show);

						});
					});

				}

				// Handle scaling on the plate using the mousewheel
				show.elements.viewport.on('wheel mousewheel DOMMouseScroll', function(event) {
					
					// Prevent scrolling of the larger page when mouse wheel is used over viewport
					if (show.config.minZoom !== show.config.maxZoom) event.preventDefault();

					// Call a scale animation
					scooter.movement.scale(event, show);

				});

				// Handle panning and scaling for touch devices
				show.elements.viewport.on('touchstart', function(event) {

					// Save a reference to where the pan started on the viewport
					show.state.dragXStart = event.originalEvent.touches[0].pageX;
					show.state.dragYStart = event.originalEvent.touches[0].pageY;

					if (event.originalEvent.touches.length === 1) {

						// The user has one finger on the viewport--this is a pan

						// Pan on touchmove (default)
						if (show.config.pan) {

							show.elements.viewport.on('touchmove', function(e) {
								
								// Prevent panning of the rest of the page
								e.preventDefault();

								// Immediately stop any active animations
								show.elements.plate.stop();

								// Call a drag animation
								scooter.movement.drag(e, show);

							});

						}

					} else if (event.originalEvent.touches.length === 2) {

						// The user has two fingers on the viewport--this is a scale

						// Disable other touchmove events to stop panning (one finger hit the viewport first)
						show.elements.viewport.off('touchmove');

						// Record position of second finger
						show.state.scaleXStart = event.originalEvent.touches[1].pageX;
						show.state.scaleYStart = event.originalEvent.touches[1].pageY;

						// Pass event to scaling function when fingers move
						show.elements.viewport.on('touchmove', function(e) {
							
							// Prevent panning of the rest of the page
							e.preventDefault();

							// Call a scaling animation
							scooter.movement.scale(e, show);

						});

					}

				});

				// Disable panning on mouseup, touchend, or mouseout
				show.elements.viewport.on('mouseup touchend mouseout', function() {
					show.elements.viewport.off('mousemove touchmove');
				});

				show.elements.plate.on('mouseup', function() {
					show.elements.viewport.off('mousemove');
				});

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////   Attach animations between page elements   /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			attachTargets: function(show) {

				if (!show.config.targets) {
					return false;
				}

				// Cycle through targets in the config and attach events to each
				for (var trigger in show.config.targets) {

					if ($(trigger).length) {

						if (typeof show.config.targets[trigger] === 'string' || typeof show.config.targets[trigger] === 'function' || Object.prototype.toString.call(show.config.targets[trigger]) === '[object Array]') {

							// This is a basic click event
							attachSimpleTarget(trigger, show.config.targets[trigger]);

						} else if (typeof show.config.targets[trigger] === 'object') {
							
							// This is a specific event
							if (show.config.targets[trigger].target) {

								attachTarget(trigger, show.config.targets[trigger]);

							} else {

								console.log('Scooter - Config error: Trigger "' + trigger + '" improperly configured. Please see docs.');

							}

						}

					}

				}

				// If the window resizes, automatically center the current target into the newly-sized viewport
				$(window).resize(function() {
					
					scooter.movement.scootTo(show, {
						target: show.state.currentTarget,
						duration: 400,
						easing: 'linear',
						scale: show.state.currentScale,
						travelScale: show.state.currentScale,
						scaleDuration: 400
					});

				});

				function attachSimpleTarget(trigger, target) {

					// Scoot to the target when the trigger is clicked
					$(trigger).click(function() {
						
						// If the target is returned from a function, resolve it now
						if (typeof target === 'function') {
							target = target();
						}

						scooter.movement.scootTo(show, {target: target});

					});

				}

				function attachTarget(trigger, targetConfig) {

					targetConfig.event = targetConfig.event || 'click';

					// Scoot to the target when the the event occurs on the trigger
					$(trigger).on(targetConfig.event, function() {
						
						// If the target is returned from a function, resolve it now
						if (typeof targetConfig.target === 'function') {
							targetConfig.target = targetConfig.target();
						}

						scooter.movement.scootTo(show, targetConfig);

					});

				}

			}

		};

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	/////////
	////////
	///////		Calc
	//////			- Math utilities for finding the center of elements
	/////
	////
	///
	//

		scooter.calc = {

			currentPosition: function(show) {
				return [
					show.elements.plate.offset().left - show.elements.viewport.offset().left - scooter.calc.viewportRadius(show).width,
					show.elements.plate.offset().top - show.elements.viewport.offset().top - scooter.calc.viewportRadius(show).height
				]
			},

			viewportRadius: function(show) {
				return {
					height: Math.floor(show.elements.viewport.height() / 2),
					width: Math.floor(show.elements.viewport.width() / 2)
				};
			},

			plateRadius: function(show) {
				return {
					height: Math.floor(show.elements.plate.height() / 2),
					width: Math.floor(show.elements.plate.width() / 2)
				};
			},

			targetCenter: function(show, target) {
				
				if (typeof target === 'function') {
					target = target();
				}

				return [
					Math.floor($(target).outerWidth() / 2) * show.state.currentScale + ($(target).offset().left - $(show.elements.plate).offset().left),
					Math.floor($(target).outerHeight() / 2) * show.state.currentScale + ($(target).offset().top - $(show.elements.plate).offset().top)
				]
			},

			coordinateFix: function(show, coords, targetConfig) {
				
				var offset = [];
				offset[0] = (coords[0] * -1) / targetConfig.travelScale + scooter.calc.viewportRadius(show).width;
				offset[1] = (coords[1] * -1) / targetConfig.travelScale + scooter.calc.viewportRadius(show).height;

				return offset;

			},

			distance: function(point1, point2) {

				return Math.abs(Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)));

			},

			findDurations: function(show, targetConfig) {

				// Create an array of points from which to determine travel distances
				var points = [];

				// Push the current position
				points.push(scooter.calc.currentPosition(show));

				// Push waypoints
				for (var i = 0; i < show.state.waypoints.length; i++) {
					points.push(show.state.waypoints[i]);
				}

				// Push target
				points.push(targetConfig.target);

				// If any points in the array are selectors, resolve them to offset center x,y arrays
				for (var j = 0; j < points.length; j++) {
					if (typeof points[j] === 'string') {
						points[j] = scooter.calc.targetCenter(show, points[j]);
					}
				}

				console.log(points);

				// Create an array to store the distances of each move
				var distances = [];
				var distanceTotal = 0;

				// Record distances between each set of points
				for (var k = 0; k < points.length - 1; k++) {
					distances.push(scooter.calc.distance(points[k], points[k + 1]));
					distanceTotal += distances[k];
				}

				var durations = [];

				// Turn the distances into millisecond durations proportional to the total travel time
				for (var l = 0; l < distances.length; l++) {
					durations.push(Math.floor(distances[l] * targetConfig.duration / distanceTotal));
				}

				return durations;

			}

		};


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	/////////
	////////
	///////		Util
	//////			- Sanitization, etc.
	/////
	////
	///
	//

		scooter.util = {

			sanitizeConfig: function(show, config) {
				
				if (typeof config.duration !== 'number' || (!config.duration && config.duration !== 0)) {
					if (show.config.animation && show.config.animation.duration) {
						config.duration = show.config.animation.duration;
					} else {
						config.duration = 800;
					}
				}

				if (!config.easing || typeof config.easing !== 'string') {
					if (show.config.animation && show.config.animation.easing) {
						config.easing = show.config.animation.easing;
					} else {
						config.easing = 'linear';
					}
				}

				if (!config.scale || typeof config.scale !== 'number') {
					if (show.config.animation && show.config.animation.scale) {
						config.scale = show.config.animation.scale;
					} else {
						config.scale = 1;
					}
				}

				if (!config.travelScale || typeof config.travelScale !== 'number') {
					if (show.config.animation && show.config.animation.travelScale) {
						config.travelScale = show.config.animation.travelScale;
					} else {
						config.travelScale = show.state.currentScale;
					}
				}

				if (typeof config.scaleDuration !== 'number' || (!config.scaleDuration && config.scaleDuration !== 0)) {
					if (show.config.animation && show.config.animation.scaleDuration) {
						config.scaleDuration = show.config.animation.scaleDuration;
					} else {
						config.scaleDuration = 400;
					}
				}

				if (!config.callback || typeof config.callback !== 'function') {
					if (show.config.animation && show.config.animation.callback) {
						config.callback = show.config.animation.callback;
					} else {
						config.callback = function() {};
					}
				}

				return config;

			}

		}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	/////////
	////////
	///////		Movement
	//////			- Drag, scale, and traveling methods
	/////			- Methods may contain conditionals to handle touch vs. mouse
	////
	///
	//

		scooter.movement = {

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////                   Dragging                  /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			drag: function(event, show) {

				var offsetX,
					offsetY;

				if (!!event.originalEvent.touches) {

					// This is a touch event. We'll be tracking the position of the fingers relative to the page.
					// Because no offset is provided, this position will be saved on each event so that an offset may be calculated.
					offsetX = event.originalEvent.touches[0].pageX;
					offsetY = event.originalEvent.touches[0].pageY;

				} else {

					// This is a mouse event. An offset will be used unless it is not available, in which case the position will be saved to find an offset for each successive move.
					offsetX = event.offsetX || event.pageX;
					offsetY = event.offsetY || event.pageY;

				}

				// Find the distance moved. The starts were saved to state on the touchstart/mousedown event.
				var topDelta = (offsetY - show.state.dragYStart);
				var leftDelta = (offsetX - show.state.dragXStart);

				// Add the distance moved to the plate offset
				var topPosition = show.elements.plate.offset().top + topDelta;
				var leftPosition = show.elements.plate.offset().left + leftDelta;

				// Enforce right-hand boundary
				if (leftPosition > scooter.calc.viewportRadius(show).width + show.elements.viewport.offset().left) {
					return;
				}

				// Enforce left-hand boundary
				if (leftPosition < (scooter.calc.viewportRadius(show).width + show.elements.viewport.offset().left) - show.elements.plate.outerWidth() * show.state.currentScale) {
					return;
				}

				// Enforce bottom boundary
				if (topPosition >= scooter.calc.viewportRadius(show).height + show.elements.viewport.offset().top) {
					return;
				}

				// Enforce top boundary
				if (topPosition < scooter.calc.viewportRadius(show).height + show.elements.viewport.offset().top - show.elements.plate.outerHeight() * show.state.currentScale) {
					return;
				}

				// Add the distance moved to the plate offset
				show.elements.plate.offset({
					top: topPosition,
					left: leftPosition
				});

				if (!!event.originalEvent.touches) {

					// Overwrite the previous starts so that an offset can be found on next event.
					show.state.dragXStart = event.originalEvent.touches[0].pageX;
					show.state.dragYStart = event.originalEvent.touches[0].pageY;

				}

				if (!event.originalEvent.touches && !event.offsetX) {

					// This was a mouse move on a browser without offsetX/Y
					// Overwrite the previous starts so that an offset can be found on next event.
					show.state.dragXStart = event.pageX;
					show.state.dragYStart = event.pageY;

				}

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////                    Scaling                  /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			scale: function(event, show) {

				show.elements.plate.stop();

				var delta,
					newScale,
					initialDistance,
					newDistance;

				if (event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length > 1) {

					// This is a touch event

					// Resolve touch delta to 1 if spreading, -1 if pinching
					// Compare distance of dragX/Y and scaleX/Y to current finger positions
					// If farther apart, spreading. If closer, pinching.
					initialDistance = Math.abs(Math.sqrt(Math.pow(show.state.scaleXStart - show.state.dragXStart, 2) + Math.pow(show.state.scaleYStart - show.state.dragYStart, 2)));
					newDistance = Math.abs(Math.sqrt(Math.pow(event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX, 2) + Math.pow(event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY, 2)));
					delta = initialDistance > newDistance ? -5 : 5;

					// Overwrite the position values in state so that offsets can be found on successive events
					show.state.dragXStart = event.originalEvent.touches[0].pageX;
					show.state.dragYStart = event.originalEvent.touches[0].pageY;
					show.state.scaleXStart = event.originalEvent.touches[1].pageX;
					show.state.scaleYStart = event.originalEvent.touches[1].pageY;

				} else {

					// This is a wheel event
					
					// Resolve wheel data to 1 if rolling forward, -1 if rolling back
					delta = (event.wheelDelta || event.originalEvent.wheelDelta || -event.detail || -event.originalEvent.deltaY) / 120 > 0 ? 5 : -5;

				}

				newScale = show.state.currentScale + (delta / 10);

				// Only start the scale action if another isn't already going in this direction
				if (!show.state.scaleLock || !!delta !== show.state.scaleDelta) {

					// Only apply the new scale if it is within the specified or default boundaries
					if (newScale >= show.config.minZoom && newScale <= show.config.maxZoom) {

						show.state.scaleLock = true;
						show.state.scaleDelta = !!delta;

						show.elements.scaler.css({
							transition: 'all 300ms linear',
							'-webkit-transition': 'all 300ms linear',
							transform: 'scale(' + newScale + ')',
							'-webkit-transform': 'scale(' + newScale + ')'
						});

						show.state.currentScale = newScale;

						setTimeout(function() {
							show.state.scaleLock = false;
						}, 200);

					}

				}

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////              Origin (fill viewport)         /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			origin: function(show, targetConfig) {

				targetConfig.target = [scooter.calc.viewportRadius(show).width, scooter.calc.viewportRadius(show).height];

				return targetConfig;

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////                  Centering                  /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			center: function(show, targetConfig) {
				
				targetConfig.target = [scooter.calc.plateRadius(show).width, scooter.calc.plateRadius(show).height];

				return targetConfig;

			},

			///////////////////////////////////////////////////////////////////////
			/////////////                                             /////////////
			/////////////                  Traveling                  /////////////
			/////////////                                             /////////////
			///////////////////////////////////////////////////////////////////////

			dispenseWaypoint: function(show) {
				
				if (show.state.waypoints && show.state.waypoints.length > 0) {
					
					show.state.waypointConfig.target = show.state.waypoints[0];
					show.state.waypointConfig.duration = show.state.waypointDurations[0];

					show.state.waypoints.shift();
					show.state.waypointDurations.shift();

					scooter.movement.scootTo(show, show.state.waypointConfig);

				} else {
					
					scooter.movement.scootTo(show, show.state.deferredTarget);

				}

			},

			scootTo: function(show, targetConfig) {
				
				targetConfig = scooter.util.sanitizeConfig(show, targetConfig);

				var targetTop,
					targetLeft;

				if (targetConfig.target === 'center') {
					targetConfig = scooter.movement.center(show, targetConfig);
				}

				if (targetConfig.target === 'origin') {
					targetConfig = scooter.movement.origin(show, targetConfig);
				}

				// Defer this action if waypoints have been used
				if (targetConfig.waypoints && targetConfig.waypoints.length > 0) {

					show.state.waypoints = [];
					for (var i = 0; i < targetConfig.waypoints.length; i++) {
						show.state.waypoints.push(targetConfig.waypoints[i]);
					}

					show.state.waypointDurations = scooter.calc.findDurations(show, targetConfig);
					
					show.state.deferredTarget = {};
					for (var key in targetConfig) {
						show.state.deferredTarget[key] = targetConfig[key];
					}
					show.state.deferredTarget.duration = show.state.waypointDurations[show.state.waypointDurations.length - 1];
					show.state.deferredTarget.waypoints = false;

					show.state.waypointConfig = {};
					for (var key in targetConfig) {
						show.state.waypointConfig[key] = targetConfig[key];
					}
					show.state.waypointConfig.scale = show.state.waypointConfig.travelScale;
					show.state.waypointConfig.waypoints = false;
					show.state.waypointConfig.callback = function() {
						scooter.movement.dispenseWaypoint(show);
					};

					scooter.movement.dispenseWaypoint(show);
					return false;

				}

				
				// Save the current target in case the window resizes
				show.state.currentTarget = targetConfig.target;

				// Scale to 1, move, scale to specified or default scale
				// Moving while not at a scale of 1 makes for some pretty tough offsets to track--this is simpler
				scaleIt(targetConfig.travelScale, function() {
					moveIt(function() {
						scaleIt(targetConfig.scale, targetConfig.callback);
					});
				});

				function scaleIt(amount, cb) {
					
					if (show.state.currentScale !== amount) {
						
						// Assign a CSS transition and transform
						show.elements.scaler.css({
							transition: 'all ' + targetConfig.scaleDuration + 'ms linear',
							'-webkit-transition': 'all ' + targetConfig.scaleDuration + 'ms linear',
							transform: 'scale(' + amount + ')',
							'-webkit-transform': 'scale(' + amount + ')'
						});

						// Allow the transition time to run before calling a recursive waiting function
						setTimeout(function() {
							scaleWait(amount, cb);
						}, targetConfig.scaleDuration);

					} else {
						
						cb();

					}

				}

				function scaleWait(amount, cb) {
					
					// Compare the bounding client rect with the unscaled size to see if proportion matches the requested scale
					if (show.elements.plate[0].getBoundingClientRect().width / show.elements.plate.width() === amount) {
						
						// Scaling completed successfully
						show.state.currentScale = amount;
						cb();

					} else {

						// Scaling has not yet completed, rerun the function in 100ms
						setTimeout(function() {
							scaleWait(amount, cb);
						}, 100);

					}
				}

				function moveIt(cb) {
					
					var targetCoordinates;

					if (typeof targetConfig.target === 'string') {

						targetCoordinates = scooter.calc.coordinateFix(show, scooter.calc.targetCenter(show, targetConfig.target), targetConfig);

					} else if (Object.prototype.toString.call(targetConfig.target) === '[object Array]') {

						targetCoordinates = scooter.calc.coordinateFix(show, targetConfig.target, targetConfig);

					}

					show.elements.plate.stop().animate({
						top: targetCoordinates[1],
						left: targetCoordinates[0]
					}, targetConfig.duration, targetConfig.easing, cb);

				}

			}

		};

	}

})();