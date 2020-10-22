let leaflet, marker, mouseCoords = [];

const updateCoords = ({latlng: {lat, lng}}) => {
  mouseCoords = [lat, lng];
};

export default {
  get mouseCoords() { return mouseCoords; },
  setup(map) {
    if (!leaflet) {
      leaflet = L.map(map, {keyboard: false});
      leaflet.on('mousedown', updateCoords);
      leaflet.on('mousemove', updateCoords);
    }
  },
  show(coords) {
    if (marker) {
      marker.setLatLng(coords);
      leaflet.panTo(coords);
    }
    else {
      leaflet.setView(coords, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leaflet);
      marker = L.marker(coords).addTo(leaflet);
    }
  }
};
