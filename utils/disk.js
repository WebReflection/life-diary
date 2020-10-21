const {readdir, stat} = require('fs');
const {join} = require('path');

const {floor, log, pow} = Math;

const filter = files => files.filter(file => !/^\./.test(file));

const crawl = folder => new Promise($ => {
  readdir(folder, (err, files) => {
    if (err)
      $(0);
    else {
      const all = [];
      for (const file of files) {
        if (file !== '.' && file !== '..')
          all.push(size(join(folder, file)));
      }
      Promise.all(all).then(sumAll).then($);
    }
  });
});

const readable = bytes => {
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = floor(log(bytes) / log(1000));
  return i ?
    `${(bytes / pow(1000, i)).toFixed(1)} ${sizes[i]}` :
    `${bytes} ${sizes[i]}`;
};

const size = file => new Promise($ => {
  stat(file, (err, stats) => {
    if (err)
      $(0);
    if (stats.isDirectory())
      crawl(file).then($);
    else
      $(stats.size);
  });
});

const sum = (tot, curr) => tot + curr;
const sumAll = results => results.reduce(sum, 0);

exports.size = file => size(file).then(readable);

exports.files = folder => new Promise($ => {
  readdir(folder, (err, files) => {
    $(err ? [] : filter(files));
  });
});

exports.filter = filter;
