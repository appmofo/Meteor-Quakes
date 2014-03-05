Quakes = new Meteor.Collection("quakes");
Meteor.subscribe('quakes');
/*
Meteor.startup(function() {
setInterval(function () {
            Meteor.call("updateData", function (error, result) {
                Quakes.remove({});
            });
        }, 60000);
});
*/

Template.quakelist.quakes = function() {
    //var q = Quakes.find({});
    //console.log("q: ",q);
    return Quakes.find({});
}

Meteor.Router.add({
    '/': 'map',
    '/list': 'quakelist'
});
