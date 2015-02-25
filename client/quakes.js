Quakes = new Meteor.Collection("quakes");
Meteor.startup(function() {

});

Template.quakelist.helpers({
    quakes: function() {
        return Quakes.find({});
    }
});

Router.configure({
  debug: false,
  before: function() {
	this.next();
  }
});

Router.map(function() {
	this.route('map', { path: '/'});
	this.route('quakelist', { path : '/list'});
});
