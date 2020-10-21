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

// this RegExp is actually from dms-js ❤️ thank you!
// https://github.com/WSDOT-GIS/dms-js/commit/a1320d50072f516f9d404fbaf7713e2341c9f1de#diff-4ffd29ab208a2ca9ef1a446eed93deead5c55c5b2615d3428daae3c9c2af9c78R29
const DMS = /^(-?\d+(?:\.\d+)?)[°:d]?\s?(?:(\d+(?:\.\d+)?)['′ʹ:]?\s?(?:(\d+(?:\.\d+)?)["″ʺ]?)?)?\s?([NSEW])?/i;

const DEG = /\s*deg/i;
const {abs} = Math;

const convert = dms => {
  const [$, deg, min, sec, hemy] = (dms.match(DMS) || []);
  if ($) {
    const [d, m, s] = [
      parseFloat(deg),
      (parseFloat(min) / 60) || 0,
      (parseFloat(sec) / 3600) || 0
    ];
    return /[SW]/i.test(hemy) ? (-abs(d) - m - s) : (d + m + s);
  }
  return NaN;
};

export default {
  // this currently converts only WSG-84 compatible EXIF values
  coords({
    GPSMapDatum,
    GPSLatitude: LA, GPSLatitudeRef: LAR,
    GPSLongitude: LO, GPSLongitudeRef: LOR
  }) {
    if (/WGS.*84/i.test(GPSMapDatum) && LA && LAR && LO && LOR) {
      const lat = convert(`${LA.replace(DEG, '°')} ${LAR[0]}`);
      const long = convert(`${LO.replace(DEG, '°')} ${LOR[0]}`);
      if (!isNaN(lat) && !isNaN(long))
        return [lat, long];
    }
    return [];
  },
  convert
};
