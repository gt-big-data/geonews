var geonews = angular.module('geonews');

geonews.controller('MapController', MapController);

MapController.$inject = ['$state', '$http', '$interpolate'];
function MapController($state, $http, $interpolate) {
    // We'll use these to display information about a location when a user
    // mouses over the location.
    var lines = [];
    var locationInfoWindow = new google.maps.InfoWindow();
    locationInfoWindow.addListener('closeclick', function(event) {
        lines.forEach(function(line) {
            line.setMap(null);
        });
        lines = [];
    })
    var lineInfoWindow = new google.maps.InfoWindow();

    var circleTooltipFn = $interpolate(
            '<a>{{name}} <span class="badge">{{frequency}}</span></a>');

    var lineTooltipFn = $interpolate(
            '<a>{{first.name}} and {{second.name}} <span class="badge">{{frequency}}</span></a>');



    init();


    function init() {
        // create a new google map and render it into the div with the id map
        var map = new google.maps.Map(d3.select("#map").node(), {
            zoom: 2,
            center: new google.maps.LatLng(37.76487, 20.41948),
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });

        var styles = [
              {
                featureType: "all",
                elementType: "labels",
                stylers: [
                  { visibility: "off" }
                ]
              }
        ];

        map.setOptions({styles: styles});

        // fetch the data from the server
        $http.get('/entities').then(responseHandler);


        function responseHandler(response) {
            var locations = response.data;
            // Convert the locations into google.maps.Circle objects.
            var circles = locations.map(function(location) {
                var circle = new google.maps.Circle({
                    strokeColor: 'red',
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    fillColor: 'red',
                    fillOpacity: 0.5,
                    center: new google.maps.LatLng(location.lat,
                        location.lng),
                    radius: location.frequency * 1000,
                    zIndex: 50
                });
                circle.model = {id: location.id, frequency: location.frequency,
                    name: location.name};
                return circle;
            });

            // Add the circles to the map
            circles.forEach(function(circle) {
                circle.setMap(map);

                circle.addListener('mouseover', function(event) {
                    locationInfoWindow.setContent(
                        circleTooltipFn(this.model));
                    locationInfoWindow.setPosition(new google.maps.LatLng(this.center.lat(), this.center.lng()))
                    locationInfoWindow.setMap(map);
                });

                circle.addListener('click', function(event) {
                    $state.go('entity.articles', {id: this.model.id, name: this.model.name});
                    lines.forEach(function(line) {
                        line.setMap(null);
                    });
                    // Get related entities from the server
                    $http.get('/related/' + circle.model.id).then(function(response) {
                        var lookup = d3.map();
                        var ids = response.data.map(function(d) {
                            return lookup.set(d.id, d.frequency);
                        });
                        var related = circles.filter(function(circle) {
                            return lookup.has(circle.model.id);
                        });
                        var start = new google.maps.LatLng(this.center.lat(), this.center.lng());
                        lines = related.map(function(d) {
                            var end = new google.maps.LatLng(d.center.lat(), d.center.lng());
                            var path = [start, end];
                            var line = new google.maps.Polyline({
                                path: path,
                                geodesic: true,
                                zIndex: 10,
                                strokeWeight: 0.5,
                                strokeWeight: lookup.get(d.model.frequency)
                            });
                            line.model = {
                                first: circle.model,
                                second: d.model,
                                frequency: lookup.get(d.model.frequency)
                            };

                            line.addListener('click', function(event){ //looks for specific action of user (click)
                                lineInfoWindow.setContent(lineTooltipFn(this.model));
                                lineInfoWindow.setMap(map);
                                lineInfoWindow.setPosition(new google.maps.LatLng(event.latLng.lat(), event.latLng.lng()));
                            });

                            line.addListener('mouseover', function(e){
                                line.setOptions({strokeColor: 'blue'})
                            });

                            line.addListener('mouseout', function(e){
                                line.setOptions({strokeColor: 'black'})
                            });
                            line.setMap(map);
                            return line;
                        });
                    // This == circle
                    }.bind(this));
                });
            });
        }
    }
}