var geonews = angular.module('geonews');

geonews.controller('MapController', MapController);

MapController.$inject = ['$http'];
function MapController($http) {
    // We'll use this to display information about a location when a user
    // mouses over the location.
    var infoWindow = new google.maps.InfoWindow();

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
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    fillColor: '#FF0000',
                    fillOpacity: 0.5,
                    center: new google.maps.LatLng(location.geo.latitude,
                        location.geo.longitude),
                    radius: location.frequency * 1000
                });
                circle.model = {id: location.id, frequency: location.frequency};
                return circle;
            });

            // Add the circles to the map
            circles.forEach(function(circle) {
                circle.setMap(map);
            });
        }
    }
}