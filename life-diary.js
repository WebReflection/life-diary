#!/usr/bin/env node

const {extname, join, resolve} = require('path');
const {createReadStream, rmdir, unlink, mkdir, readFile, stat} = require('fs');

const {log, warn} = require('essential-md');

const include = util => require(join(__dirname, 'utils', `${util}.js`));
const {FOLDER, TMP, PORT} = include('bootstrap');
const {files, size} = include('disk');
const transform = include('transform');
const IPv4 = include('IPv4');



// SERVER
const mime = require('mime-types');
const express = require('express');
const fileUpload = require('express-fileupload');

const {parse} = JSON;
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

app.use(express.static(PUBLIC));



// DELETE - TODO implement optional authentication to write
app.delete('/album/:name/:file', ({params: {name, file}}, res) => {
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

app.delete('/album/:name', ({params: {name}}, res) => {
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



// GET - Album - TODO implement optional authentication to read
app.get('/album/:name/:file', ({params: {name, file}}, res) => {
  const image = join(FOLDER, name, file);
  if (resolve(image).indexOf(FOLDER)) {
    warn`Illegal file *get* operation: \`${image}\``;
    res.send('NO');
  }
  else {
    const path = extname(image) === '.json' ?
      join(FOLDER, name, '.json', file.slice(0, -5)) :
      image;
    stat(path, err => {
      if (err)
        res.send('');
      else {
        res.set('Content-Type', mime.lookup(image));
        createReadStream(path).pipe(res);
      }
    });
  }
});

app.get('/album/:name', ({url, params: {name}}, res) => {
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
        .then(noCache.bind(res));
      });
    }
    else
      createReadStream(join(PUBLIC, 'index.html')).pipe(res);
  }
});

app.get('/albums', (_, res) => {
  files(FOLDER).then(noCache.bind(res));
});



// GET - Size - TODO implement optional authentication to read
const sendSize = (res, folder) => {
  if (!sizes.has(folder))
    sizes.set(folder, size(folder));
  sizes.get(folder).then(noCache.bind(res));
};

app.get('/size/:name', ({params: {name}}, res) => {
  const album = join(FOLDER, name);
  if (resolve(album).indexOf(FOLDER)) {
    warn`Illegal folder *size* operation: \`${album}\``;
    res.send('NO');
  }
  sendSize(res, album);
});

app.get('/size', (_, res) => {
  sendSize(res, FOLDER);
});



// POST - TODO implement optional authentication to write
app.post('/upload', ({files, query: {album}}, res) => {
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

// TODO - Implement image editing
app.post('/update', () => {
  res.send('NO');
});



// SERVER LISTEN
app.listen(PORT, '0.0.0.0', () => {
  log``;
  log`# life-diary ❤️ `;
  for (const ip of IPv4())
    log` -visit-  **''http://${ip}:${PORT}/''**`;
  log` -folder- ${FOLDER}`;
});



// LOCAL UTILS
function noCache(content) {
  this.set('Cache-Control', 'no-store');
  this.send(content);
}
