const {execFile} = require('child_process');
const {readFile, writeFile} = require('fs');
const {join} = require('path');

const mime = require('mime-types');
const sharp = require('sharp');
const cover = sharp.fit.cover;
const withoutEnlargement = true;

const IMAGE = /\.(?:webp|avif|a?png|jpe?g|gif|svg)$/i;
const {stringify, parse} = JSON;

const base64 = (type, data) => `data:${
  mime.lookup(type)
};base64,${
  Buffer.from(data).toString('base64')
}`;

const exif = file => new Promise($ => {
  execFile('exiftool', ['-j', '-g', file], (error, stdout) => {
    $(error ? null : parse(stdout)[0]);
  });
});

const preview = (source, dest, fallback) => sharp(source)
  .rotate()
  .resize({width: 256, height: 256, cover, withoutEnlargement})
  .toFile(dest)
  .then(
    () => new Promise($ => {
      readFile(dest, (err, data) => {
        $(err ? fallback : base64(source, data));
      });
    }),
    () => fallback
  );

module.exports = (folder, upload, full) => new Promise($ => {
  const image = join(folder, upload);
  const json = join(folder, '.json', upload);
  const data = {
    metadata: null,
    title: '',
    description: '',
    preview: '',
    full
  };
  exif(image).then(metadata => {
    data.metadata = metadata;
    console.log(metadata);
    if (metadata && metadata.EXIF) {
      data.title = metadata.EXIF.ImageDescription || '';
      data.description = metadata.EXIF.UserComment || '';
    }
    (
      IMAGE.test(image) && !/\.svg$/i.test(image) ?
        preview(image, json, full) :
        Promise.resolve(full)
    ).then(preview => {
      data.preview = preview;
      writeFile(json, stringify(data), err => {
        $(err ? null : data);
      });
    });
  });
});
