function initMap() {
    if (typeof jasperreports === 'undefined') jasperreports = {};
    if (typeof jasperreports.map === 'undefined') {
        var infowindow;
        jasperreports.map = {
            configureImage: function (parentKey, parentProps, parentOptions) {
                var width, height, originX, originY, anchorX, anchorY, pp = parentProps, pk = parentKey;

                width = pp[pk + '.width'] ? parseInt(pp[pk + '.width']) : null;
                height = pp[pk + '.height'] ? parseInt(pp[pk + '.height']) : null;

                originX = pp[pk + '.origin.x'] ? parseInt(pp[pk + '.origin.x']) : 0;
                originY = pp[pk + '.origin.y'] ? parseInt(pp[pk + '.origin.y']) : 0;

                anchorX = pp[pk + '.anchor.x'] ? parseInt(pp[pk + '.anchor.x']) : 0;
                anchorY = pp[pk + '.anchor.y'] ? parseInt(pp[pk + '.anchor.y']) : 0;

                parentOptions[pk] = {
                    url: pp[pk + '.url'],
                    size: width && height ? new google.maps.Size(width, height) : null,
                    origin: new google.maps.Point(originX, originY),
                    anchor: new google.maps.Point(anchorX, anchorY)
                };
            },
            createInfo: function (parentProps) {
                var pp = parentProps;
                if (pp['infowindow.content'] && pp['infowindow.content'].length > 0) {
                    var gg = google.maps,
                        po = {
                            content: pp['infowindow.content']
                        };
                    if (pp['infowindow.pixelOffset']) po['pixelOffset'] = pp['infowindow.pixelOffset'];
                    if (pp['infowindow.latitude'] && pp['infowindow.longitude']) po['position'] = new gg.LatLng(pp['infowindow.latitude'], pp['infowindow.longitude']);
                    if (pp['infowindow.maxWidth']) po['maxWidth'] = pp['infowindow.maxWidth'];
                    return new gg.InfoWindow(po);
                }
                return null;
            },
            placeMarkers: function (markers, map, isForExport, useMarkerSpidering) {
                var markerArr = [];
                if (markers) {
                    var j;
                    for (var i = 0; i < markers.length; i++) {
                        var markerProps = markers[i];
                        var markerLatLng = new google.maps.LatLng(markerProps['latitude'], markerProps['longitude']);
                        var markerOptions = {
                            position: markerLatLng
                        };

                        // for spidering, do not link marker to map directly
                        if (!useMarkerSpidering) {
                            markerOptions.map = map;
                        }

                        if (markerProps['icon.url'] && markerProps['icon.url'].length > 0) this.configureImage('icon', markerProps, markerOptions);
                        else if (markerProps['icon'] && markerProps['icon'].length > 0) markerOptions['icon'] = markerProps['icon'];
                        else if (markerProps['color'] && markerProps['color'].length > 0) {
                            markerOptions['icon'] = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%7C' + markerProps['color'];
                        }
                        if (markerProps['shadow.url'] && markerProps['shadow.url'].length > 0) this.configureImage('shadow', markerProps, markerOptions);
                        else if (markerProps['shadow'] && markerProps['shadow'].length > 0) markerOptions['shadow'] = markerProps['shadow'];
                        for (j in markerProps) {
                            if (j.indexOf(".") < 0 && markerProps.hasOwnProperty(j) && !markerOptions.hasOwnProperty(j)) markerOptions[j] = markerProps[j];
                        }
                        var marker = new google.maps.Marker(markerOptions);

                        // when in export mode, do not add unnecessary listener
                        if (!isForExport) {
                            marker['info'] = this.createInfo(markerProps);
                            var clickEvent = useMarkerSpidering ? 'spider_click' : 'click';
                            google.maps.event.addListener(marker, clickEvent, function () {
                                if (map.autocloseinfo && infowindow) infowindow.close();
                                if (this['info']) {
                                    infowindow = this['info'];
                                    this['info'].open(map, this);
                                } else if (this['url'] && this['url'].length > 0) {
                                    window.open(this['url'], this['target']);
                                }
                            });
                        }
                        markerArr.push(marker);
                    }
                }
                return markerArr;
            },
            drawPaths: function (p, map, isForExport) {
                if (p) {
                    for (var k = 0; k < p.length; k++) {
                        var props = p[k], o = {}, l = [], isPoly = false;
                        var poly;
                        for (prop in props) {
                            if (prop === 'locations' && props[prop]) {
                                var loc = props[prop];
                                for (var j = 0; j < loc.length; j++) {
                                    var latln = loc[j];
                                    l.push(new google.maps.LatLng(latln['latitude'], latln['longitude']));
                                }
                            } else if (prop === 'isPolygon') {
                                isPoly = this.getBooleanValue(props[prop]);
                            } else if (prop === 'visible' || prop === 'editable' || prop === 'clickable' || prop === 'draggable' || prop === 'geodesic') {
                                o[prop] = this.getBooleanValue(props[prop]);
                            } else {
                                o[prop] = props[prop];
                            }
                        }
                        o['map'] = map;
                        if (isPoly) {
                            o['paths'] = l;
                            poly = new google.maps.Polygon(o);
                        } else {
                            o['path'] = l;
                            poly = new google.maps.Polyline(o);
                        }

                        // when in export mode, do not add unnecessary listener
                        if (!isForExport) {
                            if (o['path.hyperlink']) {
                                google.maps.event.addListener(poly, 'click', function () {
                                    window.open(this['path.hyperlink'], this['path.hyperlink.target'])
                                });
                            }
                        }
                    }
                }
            },
            getBooleanValue: function (v) {
                return (v === true || v === 'true');
            }
        }
    }
}
