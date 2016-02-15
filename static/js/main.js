var geonews = angular.module('geonews');

geonews.controller('MapController', MapController);

MapController.$inject = ['$http'];
function MapController($http) {
    init();

    function init() {
        // create a new google map and render it into the div with the id map
        var map = new google.maps.Map(d3.select("#map").node(), {
            zoom: 3,
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
            var data = response.data;
            var overlay = new google.maps.OverlayView();

            var radiusScale = d3.scale.linear()
                    .domain(d3.extent(data, function(d) {return Math.sqrt(d.frequency);}))
                    .range([1, 20]);

            var fontScale = d3.scale.linear()
                    .domain(d3.extent(data, function(d) {return d.frequency;}))
                    .range([1, 20]);

            overlay.onAdd = function() {
                var layer = d3.select(this.getPanes().overlayLayer).append("div")
                        .attr("class", "stations");

                overlay.draw = function() {
                    var projection = this.getProjection();
                    var  padding = 10;

                    function transform(d) {
                        d = new google.maps.LatLng(d.geo.latitude, d.geo.longitude);
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this)
                            .style("left", (d.x - padding) + "px")
                            .style("top", (d.y - padding) + "px");
                    }

                    var marker = layer.selectAll("svg")
                          .data(data)
                          .each(transform) // update existing markers
                          .enter().append("svg:svg")
                          .each(transform)
                          .attr("class", "marker");

                    // Add a circle.
                    marker.append("svg:circle")
                      .attr("r", function(d) {
                        return radiusScale(Math.sqrt(d.frequency));
                      })
                      .attr("cx", padding)
                      .attr("cy", padding);

                    // Add a label.
                    marker.append("svg:text")
                      .attr("x", padding + 7)
                      .attr("y", padding)
                      .attr("dy", ".31em")
                      .style('font-size', function(d) {
                        return fontScale(d.frequency) + 'px';
                      })
                      .text(function(d) { return d.name; });

                    marker.on('mouseover', function(d) {
                        console.log('hello');
                    });
                };
            }
            // Bind our overlay to the map…
            overlay.setMap(map);
        }
    }
}