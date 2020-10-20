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

const DMS = /^(-?\d+(?:\.\d+)?)[°:d]?\s?(?:(\d+(?:\.\d+)?)['′ʹ:]?\s?(?:(\d+(?:\.\d+)?)["″ʺ]?)?)?\s?([NSEW])?/i;
const {abs} = Math;

export default {
  convert(dms) {
    const [_, deg, min, sec, hem] = (dms.match(DMS) || []);
    if (_) {
      const d = parseFloat(deg);
      const m = (parseFloat(min) / 60) || 0;
      const s = (parseFloat(sec) / 3600) || 0;
      return /[SW]/i.test(hem) ? (-abs(d) - m - s) : (d + m + s);
    }
    return NaN;
  },
  coords({GPSMapDatum, GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef}) {
    const coords = [];
    if (/WGS.*84/i.test(GPSMapDatum) && GPSLatitude && GPSLatitudeRef && GPSLongitude && GPSLongitudeRef) {
      const lat = this.convert(`${GPSLatitude.replace(/\s*deg/i, '°')} ${GPSLatitudeRef[0]}`);
      const long = this.convert(`${GPSLongitude.replace(/\s*deg/i, '°')} ${GPSLongitudeRef[0]}`);
      if (!isNaN(lat) && !isNaN(long))
        coords.push(lat, long);
    }
    return coords;
  }
};
