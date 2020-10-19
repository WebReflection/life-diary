const DMS = /^(-?\d+(?:\.\d+)?)[°:d]?\s?(?:(\d+(?:\.\d+)?)['′ʹ:]?\s?(?:(\d+(?:\.\d+)?)["″ʺ]?)?)?\s?([NSEW])?/i;

export default {
  convert(dms) {
    const [_, deg, min, sec, hem] = (dms.match(DMS) || []);
    if (_) {
      const d = parseFloat(deg);
      const m = (parseFloat(min) / 60) || 0;
      const s = (parseFloat(sec) / 3600) || 0;
      return /[SW]/i.test(hem) ? (-Math.abs(d) - m - s) : (d + m + s);
    }
    return NaN;
  },
  coords({GPSMapDatum, GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef}) {
    const coords = [];
    if (/WGS.*84/i.test(GPSMapDatum) && GPSLatitude && GPSLatitudeRef && GPSLongitude && GPSLongitudeRef) {
      const lat = this.convert(`${GPSLatitude.replace(/\s+deg/i, '°')} ${GPSLatitudeRef[0]}`);
      const long = this.convert(`${GPSLongitude.replace(/\s+deg/i, '°')} ${GPSLongitudeRef[0]}`);
      if (!isNaN(lat) && !isNaN(long))
        coords.push(lat, long);
    }
    return coords;
  }
};
