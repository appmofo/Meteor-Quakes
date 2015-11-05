///////////////////////////////////////////////////////////////////////////////
// Map display

$(window).resize(function() {
	var h = $(window).height(), offsetTop = 90;
	// Calculate the top offset
	$mc = $('#map_canvas');
	$mc.css('height', (h - $('#nav').height()));
}).resize();

var daynightLayer, map, markers = [];

var initialize = function(element, centroid, zoom, features) {
	var southWest = new L.LatLng(-90, -180), northEast = new L.LatLng(90, 180), bounds = new L.LatLngBounds(southWest, northEast);

	map = L.map(element, {
		scrollWheelZoom : true,
		doubleClickZoom : true,
		boxZoom : false,
		minZoom : 2,
		maxZoom : 14,
		touchZoom : true
	}).setView(new L.LatLng(centroid[0], centroid[1]), zoom);

	L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
		opacity : 0.8
	}).addTo(map);
/*
L.tileLayer('http://{s}.tile.openweathermap.org/map/pressure_cntr/{z}/{x}/{y}.png', {
	attribution: 'Map data © OpenWeatherMap',
	opacity: 0.2,
    maxZoom : 14
}).addTo(map);
*/
//Style Options
L.crosshairs({
  style: {
    opacity: 0.6,
    fillOpacity: 0,
    weight: 1,
    color: '#333',
    radius: 1
  }
});
L.crosshairs().addTo(map);

	map.attributionControl.setPrefix('');
	// Fit bounds
	map.fitBounds(bounds);
	// Restrict to bounds
	map.setMaxBounds(bounds);

	var attribution = new L.Control.Attribution();
	attribution.addAttribution('Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community');
	attribution.addAttribution("Data by <a href='http://earthquake.usgs.gov/'>USGS</a>");

	map.addControl(attribution);
};

var addMarker = function(marker) {
	if (map != undefined){
	map.addLayer(marker);
	markers[marker.options._id] = marker;
	console.log("adding: ",marker);
	}
};

var removeMarker = function(_id) {
	var marker = markers[_id];
	if (map.hasLayer(marker))
		map.removeLayer(marker);
};

var drawMarkers = function() {
	console.log("Drawing Markers...................",Quakes);
	if (markers.length > 0) {
		for (var i = 0; i < markers.length; i++) {
			//			console.log("redrawing: ",markers[i]);
			console.log(markers);
			addMarker(markers[i]);
		}
	}
};

var drawSunlight = function(t, t2) {
	console.log('***************** Drawing Sunlight *****************');
	console.log('t : ', t);
	console.log('t2: ', t2);
	console.log('dn: ', daynightLayer);
	console.log('****************************************************');
	//console.log('Map: ',map);
	
	if (daynightLayer!==undefined) { map.removeLayer(daynightLayer); }
	
	var res = t.addTo(map);
	daynightLayer=res;
	//console.log("res: ",res,res._leaflet_id);
	t.setLatLngs(t2.getLatLngs());
	t.redraw().bringToBack();
};

var createIcon = function(quake) {
	var className = 'leaflet-div-icon ';
	className += quake.public ? 'public' : 'private';
	return L.divIcon({
		iconSize : [28, 28],
		html : '<b><small>' + quake.properties.mag + '</small></b>',
		className : className
	});
};

var openCreateDialog = function(latlng) {
	Session.set("createCoords", latlng);
	Session.set("createError", null);
	Session.set("showCreateDialog", true);
};

Template.map.created = function() {
	console.log('map created.....');
	drawMarkers();
	//drawSunlight();
                Quakes.find({}).observe({
                        added : function(quake) {
                                var marker = scaledPoint(quake,L.latLng(quake.geometry.coordinates[1], quake.geometry.coordinates[0]));
                                addMarker(marker);
                        },
                        changed : function(quake) {
                                var marker = markers[quake._id];
                                if (marker)
                                        marker.setIcon(scaledPoint(quake,L.latLng(quake.geometry.coordinates[1], quake.geometry.coordinates[0])));
                        },
                        removed : function(quake) {
                                removeMarker(quake._id);
                        }
                });
};

var pointColor = function(quake) {
	return quake.properties.mag > 5 ? '#f55' : '#a00';
}
var pointRadius = function(quake) {
    return (quake.properties.mag * 17);
    //return (quake.properties.mag - 4) * 8;
}

var scaledPoint = function(quake, latlng) {
    return L.circleMarker(latlng, {
	_id: quake._id,
        radius: pointRadius(quake),
        fillColor: pointColor(quake),
        fillOpacity: 0.6,
        weight: 0.5,
        color: '#fff'
    }).bindPopup(
        '<h2>' + quake.properties.place + '</h2>' +
        '<h3>' + new Date(quake.properties.time) + '</h3>' +
        quake.properties.mag + ' magnitude');
}

Template.map.rendered = function() {
	// basic housekeeping
		console.log("map rendered...");
		$(window).resize(function() {
			var h = ($(window).height() - $('#nav').height());
			//, offsetTop = 180; // Calculate the top offset
			$('#map_canvas').css('height', (h));
			//    var w = $(window).width(); // Calculate the top offset
			//    $('#map_canvas').css('width', w);
		}).resize();
		// initialize map events
		initialize($("#map_canvas")[0], [41.8781136, -87.66677956445312], 3);
		var t = new L.terminator();
		var t2 = new L.terminator();
		drawSunlight(t, t2);
		drawMarkers();
				
		setInterval(function() {
			t = new L.terminator();
			t2 = new L.terminator();
			drawSunlight(t, t2);
			drawMarkers();
		}, 60000);

		map.on('touchstart touchmove touchend', function(e) {
		var touchToMouse = function(event) {
		    if (event.touches.length > 1) return; //allow default multi-touch gestures to work
		    var touch = event.changedTouches[0];
		    var type = "";
    
		    switch (event.type) {
		    case "touchstart": 
		        type = "mousemove"; break;
		    case "touchmove":  
		        type="mousemove";   break;
		    case "touchend":   
		        type="mousemove";     break;
		    default: 
		        return;
		    }
	        var simulatedEvent = document.createEvent("MouseEvent");
		    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
		            touch.screenX, touch.screenY, 
		            touch.clientX, touch.clientY, false, 
		            false, false, false, 0, null);
    
		    touch.target.dispatchEvent(simulatedEvent);
		    event.preventDefault();
		};
		element.ontouchstart = touchToMouse;
		element.ontouchmove = touchToMouse;
		element.ontouchend = touchToMouse;
		});

		var self = this;
		map._resetView(map.getCenter(), map.getZoom(), true); //rerender layers

		var click = document.getElementById('click'),
		mousemove = document.getElementById('mousemove');

		map.on('mousemove', function(e) {
			console.log("event:",e);
		    window["mousemove"].innerHTML = '<br/>Lat: ' + e.latlng.lat.toString() + '<br/>Lng: ' + e.latlng.lng.toString();
		});

		var geocoder ;
		map.on('click', function(e) {
                   geocoder = new google.maps.Geocoder();
                   var latlng = new google.maps.LatLng(e.latlng.lat, e.latlng.lng);
		   window["click"].innerHTML = 'Lat: ' + e.latlng.lat.toString() + '<br/>Lng: ' + e.latlng.lng.toString();
                   geocoder.geocode({'latLng': latlng}, function(results, status)
                    {
                        if (status == google.maps.GeocoderStatus.OK)
                         {
                                if (results[0])
                                {
                                    var add= results[0].formatted_address ;
                                    var  value=add.split(",");

                                    count=value.length;
                                    country=value[count-1];
                                    state=value[count-2];
                                    city=value[count-3];
                                    var newstr = value.toString().replace(/, /gi, '<br/>');
                                    console.log("data: " + newstr);
                                    console.log("city name is: " + city);
				    console.log(window,e);
                                    window["click"].innerHTML = newstr;
                                    window["click"].innerHTML += '<br/>Lat: ' + e.latlng.lat.toString() + '<br/>Lng: ' + e.latlng.lng.toString();
                                }
                                else
                                {
                          console.log("address not found");
                                }
                        }
                         else
                        {
                        //document.getElementById("location").innerHTML="Geocoder failed due to: " + status;
                        console.log("Geocoder failed due to: " + status);
                        }
                     });
                    });
};
