BrowserPolicy.content.allowOriginForAll('*');
Meteor.startup(function() {
    Fiber = Npm.require('fibers');
    Quakes = new Meteor.Collection("quakes");
    //Quakes.remove({});
    Fiber(function () {
        Meteor.call("updateData", function(err, result) {
        if(err) {
                console.log("Error: " + err.reason);
                console.log("error occured on receiving data on server. ", err );
                } else if(result) {
                console.log("result: ", result);
                }
        });
        }).run();
 
    setInterval(function() {
	Fiber(function () {
        Meteor.call("updateData", function(err, result) {
	if(err) {
		console.log("Error: " + err.reason);
		console.log("error occured on receiving data on server. ", err );
		} else if(result) {
		console.log("result: ", result);
		}
        });
	}).run();
    }, 60000);
});

Meteor.methods({
    quakes: function() {
        Quakes.find();
    },
    updateData: function() {
	//Quakes.remove({});
        console.log('Updating Quake data...');
        var url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
        var result = Meteor.http.get(url, {
            timeout: 10000
        });
        //console.log("Results: ",result);
        if (result.statusCode == 200) {
            var respJson = JSON.parse(result.content);
            console.log('downloading ' + respJson.metadata.count + ' quakes');
            
	    var qdata = respJson.features;
	    //console.log("fetch: ", Quakes.find().fetch());
	    var cdata = [];
	    var odata = [];
	    tmpData = Quakes.find({},{fields: {id: 1}})
	    tmpData.forEach(function(qdoc) {
		odata.push(qdoc.id);
	    });

            _.each(qdata, function(feature) {
                //console.log("f id:",feature.id);
		cdata.push(feature.id);
      
	quake = Quakes.findOne({id: feature["id"]})
      if(!quake) {
	feature._id=feature.id;
        Quakes.insert(feature);
      } else {
        Quakes.update(quake, feature);
      }
            });
        } else {
            console.log('Data content issue: ', result.statusCode);
            var errorJson = JSON.parse(result.content);
            throw new Meteor.Error(result.statusCode, errorJson.error);
        }

	console.log("cdata: ",cdata);
	console.log("odata: ",odata);
	var rlist = _.difference(odata,cdata);
	console.log("remove: ",rlist);
	
	_.each(rlist, function(d) {
                Quakes.remove(d);
	});
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
