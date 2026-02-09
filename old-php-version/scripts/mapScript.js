var map;
var api_key = '7bc8f666aee9105277c78411cba07e5c';

var locations = [
    ['Zeigler', 37.896700, -89.055350, 5],
    ['Wolf Lake', 37.529550, -89.445660, 5],
    ['Willisville', 37.982000, -89.591206, 5],
    ['Whiteash', 37.792350, -88.923490, 5],
    ['Ware', 37.2221255, -89.4542134, 5],
    ['Waltonville', 38.2136332, -89.0400125, 5],
    ['Wamac', 38.5105182, -89.1373194, 5],
    ['Vergennes', 37.901806, -89.341801, 5],
    ['Vienna', 37.416033, -88.895993, 5],
    ['Ullin', 37.275490, -89.183517, 5],
    ['Thompsonville', 37.917570, -88.762230, 5],
    ['Thebes', 37.2221255, -89.4542134, 5],
    ['Tamaroa', 38.137889, -89.2302123, 5],
    ['Tamms', 37.243280, -89.262490, 5],
    ['Stonefort', 37.615870, -88.705720, 5],
    ['St. Libory', 38.3640893, -89.7132276, 5],
    ['Steeleville', 38.007056, -89.659032, 5],
    ['Shawneetown', 37.7156637, -88.1864264, 5],
    ['Sesser/Valier', 38.091783, -89.053005, 5],
    ['Schuline', 38.0901139, -89.8974731, 5],
    ['Sandusky', 37.20255, -89.27230, 5],
    ['Ruma', 38.134529, -89.997993, 5],
    ['Royalton', 37.8777373, -89.1142714, 5],
    ['Rosiclare', 37.423669, -88.346254, 5],
    ['Praire du Rocher', 38.0784009, -90.1020872, 5],
    ['Pomona', 37.6281057, -89.3367556, 5],
    ['Pittsburg', 37.777805, -88.850327, 5],
    ['Perks', 37.31029, -89.084031, 5],
    ['Percy', 38.016605, -89.617406, 5],
    ['Orient', 37.914503, -88.9748755, 5],
    ['Olmsted', 37.1809, -89.0871612, 5],
    ['Old Shawneetown', 37.6990634, -88.1370649, 5],
    ['Olive Branch', 37.1686002, -89.3522271, 5],
    ['Odin', 38.6170879, -89.0539757, 5],
    ['Oakdale', 38.2615876, -89.5014241, 5],
    ['New Harmony, IN', 38.129826, -87.933985, 5],
    ['New Burnside', 37.579849, -88.767319, 5],
    ['Mound City', 37.084890, -89.163080, 5],
    ['Mounds', 37.114220, -89.197853, 5],
    ['Makanda', 37.620602, -89.234688, 5],
    ['Maeystown', 38.225719, -90.233002, 5],
    ['McClure', 37.317730, -89.437233, 5],
    ['Lick Creek', 37.523550, -89.070780, 5],
    ['Kaskaskia', 37.922218, -89.916206, 5],
    ['Karnak', 37.294651, -88.975166, 5],
    ['Joppa', 37.206470, -88.844420, 5],
    ['Jonesboro', 37.451727, -89.268341, 5],
    ['Hurst', 37.8329894, -89.1440593, 5],
    ['Hartford', 38.830101, -90.095840, 5],
    ['Grand Tower', 37.6313495, -89.5051185, 5],
    ['Grand Chain', 37.23248661084166, -89.03445598056233, 5],
    ['Gorham, Neunart, and Jacob', 37.716897, -89.485804, 5],
    ['Goreville', 37.554605, -88.972925, 5],
    ['Golconda', 37.3677477, -88.4883713, 5],
    ['Galatia', 37.8406945, -88.6139572, 5],
    ['Future City / North Cairo', 37.0289402, -89.1881285, 5],
    ['Freeman Spur', 37.8589693, -89.0021899, 5],
    ['Fayetteville', 38.377323, -89.79467, 5],
    ['Evansville', 38.0905412, -89.9363552, 5],
    ['Equality', 37.7350718, -88.3461955, 5],
    ['Energy', 37.775613, -89.026442, 5],
    ['Elizabethtown', 37.4460303, -88.3048468, 5],
    ['Elkville', 37.906204, -89.233224, 5],
    ['Dowell', 37.940029, -89.236478, 5],
    ['Dongola', 37.362161, -89.164477, 5],
    ['Desoto', 37.817483, -89.230089, 5],
    ['Cypress', 37.365069, -89.01559, 5],
    ['Creal Springs', 37.618415, -88.832342, 5],
    ['Crainville', 37.7504911, -89.0695162, 5],
    ['Crab Orchard', 37.7295138, -88.8038199, 5],
    ['Cutler', 38.030143, -89.565768, 5],
    ['Coulterville', 38.186818, -89.60379, 5],
    ['Colp', 37.8073902, -89.0787217, 5],
    ['Cobden', 37.531516, -89.252785, 5],
    ['Christopher', 37.9738371, -89.0558593, 5],
    ['Cave-In-Rock', 37.468143, -88.166223, 5],
    ['Carrier Mills', 37.6837391, -88.6347098, 5],
    ['Carterville', 37.761852, -89.077202, 5],
    ['Campbell Hill', 37.927883, -89.547218, 5],
    ['Cambria', 37.78263, -89.122574, 5],
    ['Brookport', 37.123439, -88.627938, 5],
    ['Buncombe', 37.4715952, -88.9767952, 5],
    ['Boskydell', 37.6713167, -89.2165822, 5],
    ['Bonnie', 38.1940345089941, -88.7572748923343, 5],
    ['Baldwin', 38.182637, -89.842784, 5],
    ['Ava', 37.8896579, -89.4943984, 5],
    ['Alto Pass', 37.5701643, -89.3181079, 5],
    ['Belknap', 37.323230, -88.939540, 5],
    ['Villa Ridge', 37.162820, -89.158180, 5],
    ['Ozark', 37.541901, -88.772697, 5],
    ['Omaha', 37.8901788, -88.3026621, 5],
    ['Carbondale', 37.725281, -89.216721, 5],
];




function initMap() {
    // Map options (E) -----------------------------------------------------
    options = {
        zoom: 8,
        center: { lat: 37.594362, lng: -88.926233 },
        mapTypeID: 'terrain',
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#2b2b2b" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#accbe3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ]

    };

    map = new google.maps.Map(document.getElementById('map'), options);
    var ILPolygon = new google.maps.Polygon({
        paths: ILDelimiters,
        strokeColor: '#6d7899',
        strokeOpacity: 0.55,
        strokeWeight: 1,
        fillColor: '#6d7899',
        fillOpacity: 0.5
    });
    ILPolygon.setMap(map);

    var icon = {
        url: "images/dot.png", // url
        scaledSize: new google.maps.Size(15, 15), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconCurrent = {
        url: "images/dot_current.png", // url
        scaledSize: new google.maps.Size(15, 15), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };

    var infowindow = new google.maps.InfoWindow;

    var i;

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            map: map,
            draggable: false,
            icon: icon,
        });

        var loc = townsArr[locations[i][0]]
        if (loc != undefined) {
            marker.setIcon(iconCurrent);
            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    var objarr = [];
                    for (const [k, v] of Object.entries(townsArr[locations[i][0]])) {
                        objarr.push(k + " - <em>" + v + "</em>");
                    }
                    var townLink = "/gallery.php?town=" + locations[i][0];
                    console.log(townLink);
                    infowindow.setContent(
                        '<div class = "marker-wrapper"><b>' +
                        locations[i][0] +
                        '</b><div style = "color:black">' +
                        objarr.join('</div><div>') +
                        '</div>' +
                        '<a href="' + townLink + '">' +
                        '<div class="town-gallery-btn">' +
                        'Click for Gallery</div></a>' +
                        '</div>'
                    );
                    infowindow.open(map, marker);
                }
            })(marker, i));
        } else {
            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    infowindow.setContent(
                        '<div style="color:black">' +
                        locations[i][0] +
                        '</div><div style = "color:black">No Data Yet.</div>');
                    infowindow.open(map, marker);
                }
            })(marker, i));
        }

    }
}