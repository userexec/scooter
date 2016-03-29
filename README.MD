# Scooter
##### Map-like functionality for any HTML

Scooter is a small JavaScript library that lets you pop a section of your webpage inside another, then navigate it like Google Maps by dragging and zooming. You can also specify particular elements that, when clicked (or hovered, blurred, released, etc.) trigger panning to another element via a straight line or through waypoints. Initialize in a variable to also call those actions programmatically later! Useful for interactive flow charts and possibly other things, too...

 * Pick an element you want to use like a map
 * Pick a smaller element to put it inside of
 * Pan using mouse or touch
 * Zoom using mouse wheel or pinch
 * Automatically pan and zoom to elements on click
 * Specify custom pan speeds, zoom levels, trigger events, actions, waypoints, etc.
 * Trigger those pan and zoom actions any time from within your own scripts

Works on Chrome, Firefox, IE, Safari, Opera, Android or iPhone, and probably other places, too.

 * [Getting Scooter](#gettingscooter)
 * [Making something to scoot](#makingsomethingtoscoot)
 * [Scooting it](#scootingit)
   * [Example initialization](#exampleinitialization)
   * [Configs](#configs)
     * [plate](#plate)
     * [insertInto](#insertinto)
     * [startAt](#startat)
     * [viewportHeight](#viewportheight)
     * [viewportWidth](#viewportwidth)
     * [viewportBackground](#viewportbackground)
     * [pan](#pan)
     * [maxZoom](#maxzoom)
     * [minZoom](#minzoom)
     * [animations](#animations)
     * [targets](#targets)
       * [Simple](#simple)
       * [Complex](#complex)
   * [Traveling to targets programatically](#travelingtotargetsprogramatically)


## <a name="gettingscooter"></a> Getting Scooter

To use Scooter, first ensure that jQuery is available on your page, then include scooter.min.js after it.

## <a name="makingsomethingtoscoot"></a> Making something to scoot

Here's where things get a little conceptual. In Scooter, you have a "plate" and a "viewport." Think of the viewport like the rectangle through which you're seeing the map on Google Maps, and the plate as the map itself. The plate is larger than the viewport, but you can only see what's within the viewport's boundaries. To see the rest of it, you need to pan around.

What you'll need on your page is the area you want to act as that viewport, plus a plate you want to put inside it--a plate that's bigger than the viewport, so probably something with a width and height specified on it.

Where you put the plate doesn't matter, so long as it's in the body of your page. What goes on the plate doesn't matter--HTML, images, an iframe, who cares. As soon as scooter initializes, it will remove the plate from wherever you had it and slap it into the viewport.

## <a name="scootingit"></a> Scooting it

### <a name="exampleinitialization"></a> Example initialization

```javascript
scooter({
	plate: $('#awesome_flowchart'),
	insertInto: $('#arbitrary_rectangle'),
	targets: {
		'#bubble1': '#bubble2',
		'#bubble2': '#bubble3',
		'#button3': function() { if ( decision === 'yes' ) { return '#bubble4' ...,
		'#button4': {
			event: 'mouseover touchstart',
			target: '#bubble5',
			duration: 5000,
			easing: 'linear',
			scale: 4,
			scaleDuration: 4000,
			callback: function() {
				alert('Good job!');
			}
		}
	}
    maxZoom: 2,
    minZoom: 1,
    animations: {
        duration: 2000,
        easing: 'swing'
    }
});
```

### <a name="configs"></a> Configs

As shown in the example, Scooter is initialized by passing it an object that defines where your plate is, where you want it inserted, what elements you want to cause automatic panning to other elements, how you want your animations by default, and some additional options. Everything but the plate is optional.

#### <a name="plate"></a> plate

*Type: jQuery object*

The thing you want to scoot, probably a div with a specified width and height.

#### <a name="insertinto"></a> insertInto

*Type: jQuery object*

This is the element you'd like your plate to pan around in. It forms the boundary in which all the magic happens. If nothing is specified for insertInto, the body will be used by default for a full screen experience.


#### <a name="startat"></a> startAt

*Type: string (jQuery selector or 'center'), array ([x,y])*

This is where you would like your plate positioned when the show initializes. By default, the plate will be in the upper left-hand corner of the viewport; however, not all shows begin in the upper left.


#### <a name="viewportheight"></a> viewportHeight

*Type: string (CSS value)*

Technically the viewport is a div that Scooter makes, which by default takes up 100% of the width and height of whatever you specified for insertInto. If you need a different, special height for whatever reason, this is your property.


#### <a name="viewportwidth"></a> viewportWidth

*Type: string (CSS value)*

Same as viewportHeight, just horizontal. If you need a different, special width for whatever reason, this is your property.


#### <a name="viewportbackground"></a> viewportBackground

*Type: string (CSS value)*

By default, the background behind your plate will be a light blue gradient. This may not work with your site, so you can specify a new background here.


#### <a name="pan"></a> pan

*Type: boolean*

Defaults to true and allows panning with mouse and touch. Set to false if you're an authoritarian and the only panning you'll allow is the automatic stuff between elements in the targets object. Set to false and don't specify any targets if you hate change.


#### <a name="maxzoom"></a> maxZoom

*Type: number*

How far you'll allow the user to zoom in. 1 is normal, 2 is 200%, etc. If you want zooming disabled, set both minZoom and maxZoom to 1.


#### <a name="minzoom"></a> minZoom

*Type: number*

How far you'll allow the user to zoom out. 1 is normal, 0.5 is 50%, etc. If you want zooming disabled, set both minZoom and maxZoom to 1.


#### <a name="animations"></a> animations

*Type: object*

This object specifies your animation defaults. If this object is undefined, or properties in it are undefined, the defaults are as follows:

 * duration: 800
 * easing: linear
 * scale: 1
 * travelScale: (value of scale)
 * scaleDuration: 400
 * callback: (none)


#### <a name="targets"></a> targets

*Type: object*

The targets object uses jQuery selector strings as keys, and either jQuery selector strings or functions that return selector strings as values (simple) or more specific objects that define non-default behavior as values (complex). Simple and complex definition of targets can be used within the same targets object.


##### <a name="simple"></a> Simple

Simple targets are just strings containing a jQuery selector for where the show should pan to. When you click the key, the show travels to the value using either defaults or the values specified in the animations object.

```javascript
targets: {
    '#bubble1': '#bubble2'
    '#bubble2': function() { if ( decision === 'yes' ) { return '#bubble4' ...,
}
```


##### <a name="complex"></a> Complex

Complex targets still specify a target (the value from the simple definition), but also include other keys to specify non-default behavior such as slower travel, more pronounced scale, special callback functions on completion, or different events to trigger the move to the target. All keys except target are optional. If an event is not specified, "click" will be used. As in the simple method, the target can be a function that will return a target if conditional behavior is necessary.

```javascript
targets: {
	'#button1': {
		event: 'mouseover touchstart',
		target: '#button2',
		duration: 5000,
		easing: 'swing',
		scale: 4,
        travelScale: 2,
		scaleDuration: 4000,
        waypoints: [
        	[0,0],
            '#pretty_picture',
            [2200,1500]
        ],
		callback: function() {
			alert('Good job!');
		}
    }
}
```


### <a name="travelingtotargetsprogramatically"></a> Traveling to targets programatically

If you need access to trigger traveling to your targets later on in your own scripts, just initialize scooter to a variable, like so:

```javascript
var flowchart_show = scooter({
	plate: $('#awesome_flowchart'),
	insertInto: $('#arbitrary_rectangle'),
	targets: {
		'#bubble1': '#bubble2',
		'#bubble2': '#bubble3',
	
    ...
    
});
```

Now, if you want to the show to perform the action that would have happened had the user clicked #bubble1, you can call ```flowchart_show.trigger('#bubble1');```

Fun secret only for people reading this section: In your targets object, the key doesn't have to be a jQuery selector. You can also make it a string that isn't a selector so that it is never triggered by an event, and only usable programmatically like this, for example ```flowchart_show.trigger('doTheThing');```

Also, if you'd like to call a scoot in your program without triggering anything, just initialize your show to a variable, and then call the scootTo method like so:

```javascript
var scooter_show = scooter({ ... });

scooter.movement.scootTo(scooter_show, { target: '#element' });
// or
scooter.movement.scootTo(scooter_show, { target: [50,50] });
// or
scooter.movement.scootTo(scooter_show, { target: 'center' });
```