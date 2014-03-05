///////////////////////////////////////////////////////////////////////////////
// Map display


$(window).resize(function() {
    var h = $(window).height(),
        offsetTop = 90; // Calculate the top offset
    $mc = $('#map_canvas');
    $mc.css('height', (h - $('#nav').height()));
}).resize();

var map, markers = [];

var initialize = function(element, centroid, zoom, features) {
    var southWest = new L.LatLng(-90, -180),
        northEast = new L.LatLng(90, 180),
        bounds = new L.LatLngBounds(southWest, northEast);

    map = L.map(element, {
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        minZoom: 3,
        maxZoom: 13,
        touchZoom: true
    }).setView(new L.LatLng(centroid[0], centroid[1]), zoom);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        opacity: .5
    }).addTo(map);

    map.attributionControl.setPrefix('');
    // Fit bounds
    map.fitBounds(bounds);
    // Restrict to bounds
    map.setMaxBounds(bounds);

    var attribution = new L.Control.Attribution();
    attribution.addAttribution('Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community');
    attribution.addAttribution("Data by <a href='http://earthquake.usgs.gov/'>USGS</a>");

    map.addControl(attribution);
}

var addMarker = function(marker) {
    map.addLayer(marker);
    markers[marker.options._id] = marker;
    //console.log("drawing: ",marker);
}

var removeMarker = function(_id) {
    var marker = markers[_id];
    if (map.hasLayer(marker)) map.removeLayer(marker);
}

var drawMarkers = function() {
    console.log("current markers: ", markers);

    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
            //			console.log("redrawing: ",markers[i]);
            addMarker(markers[i]);
        }
    }
}

var drawSunlight = function() {
    console.log('***************** Drawing Sunlight *****************');
    var t = L.terminator();
    t.addTo(map);
    var t2 = L.terminator();
    t.setLatLngs(t2.getLatLngs());
    t.redraw();
}

var createIcon = function(quake) {
    var className = 'leaflet-div-icon ';
    className += quake.public ? 'public' : 'private';
    return L.divIcon({
        iconSize: [28, 28],
        html: '<b><small>' + quake.properties.mag + '</small></b>',
        className: className
    });
}

var openCreateDialog = function(latlng) {
    Session.set("createCoords", latlng);
    Session.set("createError", null);
    Session.set("showCreateDialog", true);
};

Template.map.created = function() {
    console.log('map created.....');
    drawMarkers();
}


Template.map.rendered = function() {
    // basic housekeeping
    if (!this.rendered) {
        Meteor.call("updateData", function(error, result) {
            Quakes.remove({});
        });
        Quakes.find({}).observe({
            added: function(quake) {
                //console.log("quake: ",quake);
                var marker = new L.Marker(L.latLng(quake.geometry.coordinates[1], quake.geometry.coordinates[0]), {
                    _id: quake._id,
                    icon: createIcon(quake)
                }).on('click', function(d) {
                    console.log("clicked: ", d);
                    var t = '<h3><%- title %></h3>' +
                        '<ul>' +
                        '<li>Magnitude: <%- mag %></li>' +
                        '<li>Depth: <%- depth %>km</li>' +
                        '</ul>';

                    var data = {
                        title: quake.properties.place,
                        mag: quake.properties.mag,
                        depth: quake.geometry.coordinates[2]
                    };

                    L.popup()
                        .setLatLng([d.latlng.lat, d.latlng.lng])
                        .setContent(_.template(t, data))
                        .openOn(map);
                });
                addMarker(marker);
            },
            changed: function(quake) {
                var marker = markers[quake._id];
                if (marker) marker.setIcon(createIcon(quake));
            },
            removed: function(quake) {
                removeMarker(quake._id);
            }
        });

        console.log("map rendered...");
        $(window).resize(function() {
            var h = ($(window).height() - $('#nav').height()); //, offsetTop = 180; // Calculate the top offset
            $('#map_canvas').css('height', (h));
            //    var w = $(window).width(); // Calculate the top offset
            //    $('#map_canvas').css('width', w);
        }).resize();
        // initialize map events
        initialize($("#map_canvas")[0], [41.8781136, -87.66677956445312], 3);

        drawSunlight();
        this.rendered = true;
        var self = this;
    } else {
        drawMarkers();
        drawSunlight();
    }
};
