document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    const lng = parseFloat(mapContainer.dataset.lng);
    const lat = parseFloat(mapContainer.dataset.lat);
    const title = mapContainer.dataset.title || "";
    const location = mapContainer.dataset.location || "";

    const map = L.map('map').setView([lat, lng], 10);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`<h5>${title}</h5><p>${location}</p><h4>Exact location will be provided after booking.`)
    .openPopup();

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
});
  