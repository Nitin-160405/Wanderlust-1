const mapContainer = document.getElementById("map");

if (mapContainer && mapToken) {
    mapboxgl.accessToken = mapToken;

    const coordinates = listingGeometry?.coordinates;
    const hasValidCoordinates =
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        coordinates.some((coordinate) => coordinate !== 0);

    if (!hasValidCoordinates) {
        mapContainer.innerText = "Map location is unavailable right now.";
    } else {
        const map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v12",
            center: coordinates,
            zoom: 9,
        });

        new mapboxgl.Marker()
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(listingLocation))
            .addTo(map);
    }
} else if (mapContainer) {
    mapContainer.innerText = "Map is unavailable right now.";
}
