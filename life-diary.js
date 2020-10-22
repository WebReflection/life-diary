#!/usr/bin/env node

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

const {execFile} = require('child_process');
const {extname, join, resolve} = require('path');
const {rmdir, unlink, mkdir, readFile, readdir, writeFile} = require('fs');
const {tmpdir} = require('os');

const {feature} = require('country-coder');
const {log, warn} = require('essential-md');

const include = util => require(join(__dirname, 'utils', `${util}.js`));
const {EXIF, FOLDER, TMP, PORT, PASSWORD_READ, PASSWORD_WRITE} = include('bootstrap');
const {files, filter, size} = include('disk');
const transform = include('transform');
const IPv4 = include('IPv4');



// SERVER
const auth = require('basic-auth');
const compress = require('compression');
const mime = require('mime-types');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const pass = (req, res, pass) => {
  const access = !pass || ((auth(req) || {pass: ''}).pass === pass);
  if (!access) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="life-diary"');
    res.end('Access denied');
  }
  return access;
};

const LATITUDE = new Set(['North', 'South']);
const LONGITUDE = new Set(['East', 'West']);

const {parse, stringify} = JSON;
const PUBLIC = join(__dirname, 'public');

const app = express();
const json = mime.lookup('.json');
const sizes = new Map;



// MIDLLEWARE
app.use(fileUpload({
  uploadTimeout: 0,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: TMP
}));

app.use(compress());
app.use(express.static(PUBLIC));

app.use(bodyParser.json());


// DELETE
app.delete('/album/:name/:file', (req, res) => {
  if (!pass(req, res, PASSWORD_WRITE))
    return;
  const {params: {name, file}} = req;
  const image = join(FOLDER, name, file);
  if (resolve(image).indexOf(FOLDER)) {
    warn`Illegal file *delete* operation: \`${image}\``;
    res.send('NO');
  }
  else {
    let work = 2;
    const done = () => {
      if (!--work) {
        sizes.delete(join(FOLDER, name));
        sizes.delete(FOLDER);
        res.send('OK');
      }
    };
    unlink(image, done);
    unlink(join(FOLDER, name, '.json', file), done);
  }
});

app.delete('/album/:name', (req, res) => {
  if (!pass(req, res, PASSWORD_WRITE))
    return;
  const {params: {name}} = req;
  const album = join(FOLDER, name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *delete* operation: \`${album}\``;
    res.send('NO');
  }
  else
    rmdir(album, {recursive: true}, () => {
      sizes.delete(album);
      sizes.delete(FOLDER);
      res.send('OK');
    });
});



// POST
app.post('/upload', (req, res) => {
  if (!pass(req, res, PASSWORD_WRITE))
    return;
  const {files, query: {album}} = req;
  res.set('Content-Type', json);
  if (files && files.upload && album) {
    const {upload} = files;
    const folder = join(FOLDER, album);
    const image = join(folder, upload.name);
    if (resolve(image).indexOf(FOLDER)) {
      warn`Illegal file *upload* operation: \`${image}\``;
      res.send('null');
    }
    else {
      // TODO: avoid overwriting files with the same name
      upload.mv(image).then(
        () => {
          mkdir(join(folder, '.json'), () => {
            const full = `/album/${
              encodeURIComponent(album)
            }/${
              encodeURIComponent(upload.name)
            }`;
            transform(folder, upload.name, full).then(data => {
              sizes.delete(folder);
              sizes.delete(FOLDER);
              res.send(data);
            });
          });
        },
        () => res.send('null')
      );
    }
  }
  else
    res.send('null');
});



// PUT
app.put('/album/:name/:file', (req, res) => {
  if (!pass(req, res, PASSWORD_WRITE))
    return;
  const {body, params: {name, file}} = req;
  const image = join(FOLDER, name, file);
  if (!body || resolve(image).indexOf(FOLDER)) {
    warn`Illegal file *put* operation: \`${image}\``;
    res.send('NO');
  }
  const path = join(FOLDER, name, '.json', file);
  readFile(path, (err, buffer) => {
    if (err) {
      res.send('NO');
      return;
    }
    try {
      const data = parse(buffer);
      const all = [];
      if (body.coords) {
        const {
          GPSLatitude, GPSLongitude,
          GPSLatitudeRef, GPSLongitudeRef
        } = body.coords;
        if (
          typeof GPSLatitude !== 'number' || isNaN(GPSLatitude) ||
          typeof GPSLongitude !== 'number' || isNaN(GPSLongitude) ||
          !LATITUDE.has(GPSLatitudeRef) || !LONGITUDE.has(GPSLongitudeRef)
        ) {
          res.send('NO');
          return;
        }
        else {
          data.coords = [GPSLatitude, GPSLongitude];
          data.feature = feature([GPSLongitude, GPSLatitude]);
          all.push(new Promise($ => {
            execFile('exiftool', [
              '-GPSMapDatum=WGS-84',
              `-GPSLatitude=${GPSLatitude}`,
              `-GPSLongitude=${GPSLongitude}`,
              `-GPSLatitudeRef=${GPSLatitudeRef}`,
              `-GPSLongitudeRef=${GPSLongitudeRef}`,
              '-overwrite_original', '-P', image
            ], $);
          }));
        }
      }
      else {
        const args = [];
        if (data.title !== body.title)
          args.push(`-IFD0:ImageDescription=${
            (data.title = body.title || '')
          }`);
        if (data.description !== body.description)
          args.push(`-ExifIFD:UserComment=${(
            data.description = body.description || ''
          )}`);
        ;
        if (args.length) {
          args.push('-overwrite_original', '-P', image);
          all.push(new Promise($ => {
            execFile('exiftool', args, $);
          }));
        }
      }
      all.push(new Promise($ => {
        writeFile(path, stringify(data), $);
      }));
      Promise.all(all).then(results => {
        if (results.some(err => !!err))
          res.send('NO');
        else if (body.coords) {
          res.send(stringify(data.feature) || '');
        }
        else
          res.send('OK');
      });
    }
    catch (o_O) {
      // TODO: corrupted JSON files are possible
      //       (user left early or something)
      //       be sure if the file exists
      //       its JSON gets re-sanitize
      res.send('NO');
    }
  });
});



// GET - Album - TODO implement optional authentication to read
app.get('/album/:name/:file', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  const {params: {name, file}} = req;
  const image = join(FOLDER, name, file);
  if (resolve(image).indexOf(FOLDER)) {
    warn`Illegal file *get* operation: \`${image}\``;
    res.send('NO');
  }
  else {
    const path = extname(image) === '.json' ?
      join(FOLDER, name, '.json', file.slice(0, -5)) :
      image;
    res.sendFile(path, err => {
      if (err)
        res.end('');
    });
  }
});

app.get('/album/:name', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  const {params: {name}} = req;
  const isJSON = extname(name) === '.json';
  const album = join(FOLDER, isJSON ? name.slice(0, -5) : name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *get* operation: \`${album}\``;
    res.send('NO');
  }
  else {
    if (isJSON) {
      files(join(album, '.json')).then(files => {
        Promise.all(files.map(file => new Promise($ => {
          readFile(join(album, '.json', file), (_, b) => $(parse(b || 'null')));
        })))
        .then(noCache.bind(res))
        .catch(noCache.bind(res, 'NO'));
      });
    }
    else
      res.sendFile(join(PUBLIC, 'index.html'));
  }
});

app.get('/albums', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  files(FOLDER).then(noCache.bind(res));
});

app.get('/download/:name', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  const {params: {name}} = req;
  const album = join(FOLDER, name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *get* operation: \`${album}\``;
    res.send('NO');
  }
  else {
    const tmpName = join(tmpdir(), name + '.zip');
    execFile('zip', ['-q', '-r', tmpName, album], err => {
      if (err)
        res.send('Unable to zip ' + album);
      else
        res.sendFile(tmpName);
    });
  }
});



// GET - Size - TODO implement optional authentication to read
const sendSize = (res, folder) => {
  if (!sizes.has(folder))
    sizes.set(folder, size(folder));
  sizes.get(folder).then(noCache.bind(res));
};

app.get('/size/:name', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  const {params: {name}} = req;
  const album = join(FOLDER, name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *size* operation: \`${album}\``;
    res.send('NO');
  }
  sendSize(res, album);
});

app.get('/files/:name', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  const {params: {name}} = req;
  const album = join(FOLDER, name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *size* operation: \`${album}\``;
    res.send('NO');
  }
  readdir(album, (err, files) => {
    const {length} = filter(files || []);
    noCache.call(
      res,
      err ?
        '0 files' :
        `${length} ${length === 1 ? 'file' : 'files'}`
    );
  });
});

app.get('/size', (req, res) => {
  if (!pass(req, res, PASSWORD_READ))
    return;
  sendSize(res, FOLDER);
});



// SERVER LISTEN
app.listen(PORT, '0.0.0.0', () => {
  log``;
  log`# Life Diary ❤️ `;
  log` -version-  ${
    require(join(__dirname, 'package.json')).version
  } -exiftool- ${EXIF}`;
  for (const ip of IPv4())
    log` -visit-    **''http://${ip}:${PORT}/''**`;
  log` -folder-   ${FOLDER}`;
  if (PASSWORD_WRITE) {
    if (PASSWORD_READ === PASSWORD_WRITE)
      log` -password- view/edit`;
    else
      log` -password- edit only`;
  }
});



// LOCAL UTILS
function noCache(content) {
  this.set('Cache-Control', 'no-store');
  this.send(content);
}
