import './wake-lock.js';
import {render, html} from './uhtml.js';

const showFile = (album, file) => {
  switch (true) {
    case /\.(?:webp|avif|apng|jpe?g|png|gif|svg)$/i.test(file):
      return html`<img src=${'/album/' + album + '/' + file} title=${file}>`;
    default:
      return html`<video controls src=${'/album/' + album + '/' + file} />`;
  }
};

const showFiles = (where, album) => {
  const remove = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const {currentTarget} = event;
    const {album, file} = currentTarget.dataset;
    const {parentElement} = currentTarget.closest('ul');
    fetch(`/album/${encodeURIComponent(album)}/${encodeURIComponent(file)}`, {method: 'DELETE'}).then(res => res.text()).then(() => {
      showFiles(parentElement, album);
    });
  };
  fetch(`/album/${encodeURIComponent(album)}`).then(res => res.json()).then(files => {
    render(where, html`
      <ul>
        ${files.map(file => html`
          <li>
            <button data-album=${album} data-file=${file} onclick=${remove}>DELETE</button>
            ${showFile(album, file)}
          </li>`
        )}
      </ul>
    `);
  });
};

const withUpload = album => {
  const uploadFiles = event => {
    const form = event.currentTarget.closest('form');
    const {upload} = form;

    if (upload.disabled || upload.files.length < 1)
      return;

    const {reduce} = [];
    const sum = (total, {size}) => total + size;

    const method = 'POST';
    const progress = document.querySelector('progress');

    navigator.wakeLock.request('screen').then(wakeLock => {
      fetch(
        `${form.action}?album=${encodeURIComponent(album)}`,
        {method, body: new FormData(form)}
      )
        .then(res => res.text())
        .then(() => {
          wakeLock.release();
          upload.value = '';
          upload.disabled = uploading = false;
          showFiles(form.nextElementSibling, album);
        })
        .catch(() => {
          wakeLock.release();
          upload.disabled = uploading = false;
          alert('Unable to upload');
        });

      const max = reduce.call(upload.files, sum, 0);
      let value = 0;
      let uploading = true;

      progress.max = max;
      progress.value = value;
      upload.disabled = true;

      (function update() {
        if (uploading) {
          value += (max - value) * .01;
          progress.value = value;
          requestAnimationFrame(update);
        }
        else
          progress.value = 0;
      }());
    }, () => {
      alert('Please confirm lock-screen to upload');
    });
  };

  render(document.body, html`
    <h1>${album}</h1>
    <form onsubmit=${event => event.preventDefault()} method="post" action="/upload" enctype="multipart/form-data">
      <input onchange=${uploadFiles} type="file" name="upload" accept="audio/*,image/*,video/*" multiple required>
      <progress max="1" value="0"></progress>
    </form>
    <div></div>
  `);
  showFiles(document.querySelector('form').nextElementSibling, album);
};

const createAlbum = event => {
  event.preventDefault();
  const onNameChosen = event => {
    event.preventDefault();
    withUpload(event.currentTarget.album.value.trim());
  };
  render(document.body, html`
    <form onsubmit=${onNameChosen} method="post" action="/upload" enctype="multipart/form-data">
      <input name="album" placeholder="Album name" required>
      <input type="submit">
    </form>
  `);
};

const showAlbum = event => {
  event.preventDefault();
  const {album} = event.currentTarget.dataset;
  withUpload(album);
};


const showAlbums = where => {
  const remove = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (confirm('Are you sure?')) {
      const {album} = event.currentTarget.dataset;
      fetch(`/album/${encodeURIComponent(album)}`, {method: 'DELETE'}).then(res => res.text()).then(() => {
        showAlbums(where);
      });
    }
  };
  fetch('/albums').then(res => res.json()).then(albums => {
    render(where, html`
      <button onclick=${createAlbum}>Create</button>
      <ul>
        ${albums.map(album => html`
          <li>
            <button data-album=${album} onclick=${remove}>DELETE</button>
            <a onclick=${showAlbum} data-album=${album} href=${'/album/' + album}>${album}</a>
          </li>`
        )}
      </ul>
    `);
  });
};

showAlbums(document.body);
