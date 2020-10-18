#!/usr/bin/env node

// ARGV PARSING
const {createReadStream, existsSync, readdir, rmdir, rmdirSync, statSync, unlink} = require('fs');
const {log, error} = require('essential-md');

const argv = process.argv.slice(2);
const help = argv.length !== 1 || /^(?:-h|--help)$/.test(argv[0]);
if (help || !existsSync(argv[0]) || !statSync(argv[0]).isDirectory()) {
  log`
# life-diary ❤️ 
 -your albums, your journey, your data-

 **usage**

  \`life-diary ./destination-folder\`
`;
  if (!help)
    error(`invalid folder ${argv[0]}\n`);
  process.exit(help ? 0 : 1);
}



// SERVER
const {networkInterfaces} = require('os');
const {join, resolve} = require('path');

const express = require('express');
const fileUpload = require('express-fileupload');
const mime = require('mime-types');

const {PORT = 8080} = process.env;

const FOLDER = resolve(argv[0]);
const TMP = join(FOLDER, '.tmp');
if (existsSync(TMP))
  rmdirSync(TMP);

const app = express();

app.use(fileUpload({
  uploadTimeout: 0,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: TMP
}));
app.use(express.static(join(__dirname, 'public')));

app.delete('/album/:name/:file', (req, res) => {
  unlink(join(FOLDER, req.params.name, req.params.file), () => {
    res.send('OK');
  });
});
app.delete('/album/:name', (req, res) => {
  rmdir(join(FOLDER, req.params.name), {recursive: true}, () => {
    res.send('OK');
  });
});

app.get('/album/:name/:file', (req, res) => {
  const file = join(FOLDER, req.params.name, req.params.file);
  res.set('Content-Type', mime.lookup(file));
  createReadStream(file).pipe(res);
});
app.get('/album/:name', (req, res) => {
  readdir(join(FOLDER, req.params.name), sendFiles.bind(res));
});
app.get('/albums', (_, res) => {
  readdir(FOLDER, sendFiles.bind(res));
});

app.post('/upload', (req, res) => {
  if (req.files && req.query.album) {
    const {upload} = req.files;
    if (upload) {
      for (const file of [].concat(upload))
        file.mv(join(FOLDER, req.query.album, file.name));
    }
  }
  res.send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
  log``;
  log`# life-diary ❤️ `;
  const nis = networkInterfaces();
  for (const key of Object.keys(nis)) {
    for (const interface of nis[key]) {
      if (
        interface.family === 'IPv4' &&
        interface.address !== '127.0.0.1'
      )
        log` -visit-  **''http://${interface.address}:${PORT}/''**`;
    }
  }
  log` -folder- ${FOLDER}`;
});

function sendFiles(error, files) {
  this.set('Cache-Control', 'no-store');
  this.send(error ? [] : files.filter(file => !/^\./.test(file)));
}
