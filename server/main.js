Meteor.startup(function() {
    Quakes = new Meteor.Collection("quakes");
    Bounds = new Meteor.Collection("bounds");
    Quakes.remove({});
    Bounds.remove({});
    Meteor.publish("quakes", function() {
        return Quakes.find(); // everything
    });
    Meteor.publish("bounds", function() {
        return Bounds.find(); // everything
    });

    var url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
    var result = Meteor.http.get(url, {
        timeout: 10000
    });
    //console.log("Results: ",result);
    if (result.statusCode == 200) {
        var respJson = JSON.parse(result.content);
        //console.log('Quake data received: ',respJson);
        console.log('downloading ' + respJson.metadata.count + ' quakes');
        var qdata = respJson.features;
        var bounds = respJson.bbox;
        console.log('data: ', bounds);
        Bounds.insert(bounds);
        console.log('Data: ', Bounds.find().fetch());

        //console.log('data: ',qdata);
        _.each(qdata, function(feature) {
            //console.log(feature);
            delete feature._id;
            delete feature.id;
            Quakes.insert(feature);
        });
    } else {
        console.log('Data content issue: ', result.statusCode);
        var errorJson = JSON.parse(result.content);
        throw new Meteor.Error(result.statusCode, errorJson.error);
    }
    setInterval(function() {
        Meteor.call("updateData", function(error, result) {
            Quakes.remove({});
        });
    }, 60000);
});

Meteor.methods({
    quakes: function() {
        Quakes.find();
    },
    updateData: function() {
        console.log('Updating Quake data...');
        Quakes.remove({});
        Bounds.remove({});
        var url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
        var result = Meteor.http.get(url, {
            timeout: 10000
        });
        //console.log("Results: ",result);
        if (result.statusCode == 200) {
            var respJson = JSON.parse(result.content);
            //console.log('Quake data received: ',respJson);
            console.log('downloading ' + respJson.metadata.count + ' quakes');
            var qdata = respJson.features;
            var bounds = respJson.bbox;
            Bounds.insert(bounds.coordinates);
            console.log('data: ', bounds);
            _.each(qdata, function(feature) {
                //console.log(feature);
                //delete feature._id;
                //delete feature.properties._id;
                Quakes.insert(feature);
            });
        } else {
            console.log('Data content issue: ', result.statusCode);
            var errorJson = JSON.parse(result.content);
            throw new Meteor.Error(result.statusCode, errorJson.error);
        }
    }
});
/*
{ type: 'FeatureCollection',
metadata:
{ generated: 1392789562000,
url: 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
title: 'USGS All Earthquakes, Past Hour',
status: 200,
api: '1.0.13',
count: 4 },
features:
[ { type: 'Feature',
properties: [Object],
geometry: [Object],
id: 'nc72170651' },
{ type: 'Feature',
properties: [Object],
geometry: [Object],
id: 'ci15468297' },
{ type: 'Feature',
properties: [Object],
geometry: [Object],
id: 'nc72170641' },
{ type: 'Feature',
properties: [Object],
geometry: [Object],
id: 'nc72170636' } ],
bbox: [ -122.8542, 33.164, 1.8, -115.6432, 38.826, 3.4 ] }
*/
