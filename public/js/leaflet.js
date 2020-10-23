/**
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 *
 */

const MAP_SERVER = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors";

let leaflet, marker, mouseCoords = [];
let visibleMarker = false;

const updateCoords = ({latlng: {lat, lng}}) => {
  mouseCoords = [lat, lng];
};

export default {
  get mouseCoords() { return mouseCoords; },
  setup(map) {
    if (!leaflet) {
      leaflet = L.map(map, {keyboard: false, minZoom: 2});
      leaflet.on('mousedown', updateCoords);
      leaflet.on('mousemove', updateCoords);
    }
  },
  show(coords) {
    const hasCoords = !!coords.length;
    if (!marker) {
      if (!hasCoords)
        coords = [0, 0];
      leaflet.setView(coords, 16);
      L.tileLayer(MAP_SERVER, {attribution: MAP_ATTRIBUTION}).addTo(leaflet);
      marker = L.marker(coords);
    }
    if (hasCoords) {
      if (!visibleMarker) {
        visibleMarker = true;
        marker.addTo(leaflet);
      }
      marker.setLatLng(coords);
      leaflet.panTo(coords);
    }
    else {
      if (visibleMarker) {
        visibleMarker = false;
        leaflet.removeLayer(marker);
      }
    }
  }
};
