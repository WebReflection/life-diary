#!/usr/bin/env node

const {extname, join, resolve} = require('path');
const {rmdir, unlink, mkdir, readFile, readdir, writeFile} = require('fs');

const {log, warn} = require('essential-md');

const include = util => require(join(__dirname, 'utils', `${util}.js`));
const {FOLDER, TMP, PORT, PASSWORD_READ, PASSWORD_WRITE} = include('bootstrap');
const {files, size} = include('disk');
const transform = include('transform');
const IPv4 = include('IPv4');



// SERVER
const auth = require('basic-auth');
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

app.put('/album/:name/:file', (req, res) => {
  if (!pass(req, res, PASSWORD_WRITE))
    return;
  const {body, params: {name, file}} = req;
  const image = join(FOLDER, name, file);
  if (!body || resolve(image).indexOf(FOLDER)) {
    warn`Illegal file *put* operation: \`${image}\``;
    res.send('NO');
  }
  else {
    const path = join(FOLDER, name, '.json', file);
    readFile(path, (err, data) => {
      if (err)
        res.send('NO');
      else {
        try {
          const info = parse(data);
          info.title = body.title || '';
          info.description = body.description || '';
          writeFile(path, stringify(info), err => {
            res.send(err ? 'NO' : 'OK');
          });
        }
        catch (o_O) {
          // TODO: corrupted JSON files are possible
          //       (user left early or something)
          //       be sure if the file exists
          //       its JSON gets re-sanitize
          res.send('NO');
        }
      }
    });
  }
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
    noCache.call(
      res,
      err ?
        '0 files' :
        `${files.length} ${files.length === 1 ? 'file' : 'files'}`
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
  log`# life-diary ❤️ `;
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
