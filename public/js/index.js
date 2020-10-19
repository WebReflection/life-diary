import './wake-lock.js';
import {render, html} from './3rd/uhtml.js';

const IMAGE = /\.(?:webp|avif|a?png|jpe?g|gif|svg)$/i;

const json = file => fetch(file).then(b => b.json());

const showFile = file => {
  const {full, preview, title, description} = file;
  switch (true) {
    case IMAGE.test(full):
      return html.for(file, 'img')`<img src=${preview} title=${title}>`;
    default:
      return html.for(file, 'img')`<video controls src=${preview} />`;
  }
};

const renderFiles = (where, album, files) => {
  const remove = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const {currentTarget} = event;
    const {data: file} = currentTarget;
    currentTarget.disabled = true;
    fetch(file.full, {method: 'DELETE'})
      .then(res => res.text()).then(result => {
        currentTarget.disabled = false;
        const i = files.indexOf(file);
        if (result === 'OK' && -1 < i) {
          files.splice(i, 1);
          renderFiles(where, album, files);
        }
      });
  };
  render(where, html.for(files, 'ul')`
    <ul>
      ${files.map(file => html.for(file, 'li')`
        <li>
          <button .data=${file} onclick=${remove}>DELETE</button>
          ${showFile(file)}
        </li>`
      )}
    </ul>
  `);
};

const withUpload = album => {
  json(`/album/${encodeURIComponent(album)}.json`).then(files => {
    const uploadFiles = event => {
      const form = event.currentTarget.closest('form');
      const {upload} = form;
      const {disabled, files: uploads} = upload;

      if (disabled || uploads.length < 1)
        return;

      const {reduce} = [];
      const sum = (total, {size}) => total + size;

      const method = 'POST';

      navigator.wakeLock.request('screen').then(wakeLock => {
        const max = reduce.call(uploads, sum, 0);
        const {length} = uploads;
        let uploading = true;
        let nextValue = 0;
        let value = 0;

        status.current.textContent = `0/${length}`;
        progress.current.max = max;
        progress.current.value = value;
        upload.disabled = true;
  
        (function uploadFile(i) {
          if (i === length) {
            status.current.textContent = '';
            upload.value = '';
            upload.disabled = uploading = false;
            wakeLock.release();
          }
          else {
            nextValue += uploads[i].size;
            const body = new FormData();
            body.append('upload', uploads[i]);
            fetch(
              `${form.action}?album=${encodeURIComponent(album)}`,
              {method, body}
            )
            .then(res => res.json())
            .then(file => {
              files.unshift(file);
              status.current.textContent = `${++i + 1}/${length}`;
              renderFiles(list.current, album, files);
              uploadFile(i);
            })
            .catch(() => {
              uploadFile(length);
              alert(`Unable to upload ${uploads[i].name}`);
            });
          }
        }(0));
  
        (function update() {
          if (uploading) {
            value += (nextValue - value) * .02;
            progress.current.value = value;
            requestAnimationFrame(update);
          }
          else
            progress.current.value = 0;
        }());
  
      }, () => {
        alert('Please confirm lock-screen to upload');
      });
    };
    const list = {};
    const progress = {};
    const status = {};
    render(document.body, html`
      <h1>${album}</h1>
      <form onsubmit=${event => event.preventDefault()} method="post" action="/upload" enctype="multipart/form-data">
        <input onchange=${uploadFiles} type="file" name="upload" accept="audio/*,image/*,video/*" multiple required>
        <progress ref=${progress} max="1" value="0"></progress> <small ref=${status} />
      </form>
      <div ref=${list}></div>
    `);
    renderFiles(list.current, album, files);
  });
};

const createAlbum = event => {
  event.preventDefault();
  const onNameChosen = event => {
    event.preventDefault();
    const {album, submit} = event.currentTarget;
    const value = album.value.trim();
    if (value.length) {
      submit.disabled = true;
      withUpload(value);
    }
  };
  render(document.body, html`
    <form onsubmit=${onNameChosen} method="post" action="/upload" enctype="multipart/form-data">
      <input name="album" placeholder="Album name" required autofocus>
      <input name="submit" type="submit">
    </form>
  `);
};

const showAlbum = event => {
  event.preventDefault();
  const {album} = event.currentTarget;
  withUpload(album);
  history.pushState(null, album, `/album/${encodeURIComponent(album)}`);
};


const showAlbums = where => {
  const remove = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (confirm('Are you sure?')) {
      const {album} = event.currentTarget;
      fetch(`/album/${encodeURIComponent(album)}`, {method: 'DELETE'}).then(res => res.text()).then(() => {
        showAlbums(where);
      });
    }
  };
  json('/albums').then(albums => {
    render(where, html`
      <button onclick=${createAlbum}>Create</button>
      <ul>
        ${albums.map(album => html`
          <li>
            <button .album=${album} onclick=${remove}>DELETE</button>
            <a onclick=${showAlbum} .album=${album} href=${'/album/' + album}>${album}</a>
          </li>`
        )}
      </ul>
    `);
  });
};

const popstate = () => {
  if (/^\/album\/([^/]+?)$/.test(location.pathname))
    withUpload(decodeURIComponent(RegExp.$1));
  else
    showAlbums(document.body);
};

addEventListener('popstate', popstate);

popstate();
