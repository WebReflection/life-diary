import('./wake-lock.js');

Promise.all([
  import('./3rd/uce-loader.js'),
  import('./3rd/uce-template.js')
]).then(([{loader}]) => {

  const {render, html} = customElements.get('uce-lib');
  const Template = customElements.get('uce-template');
  const main = document.querySelector('main');

  // Autoload Components
  loader({
    on(name) {
      if (name !== 'uce-template') {
        fetch(`/comp/${name}.uce`).then(b => b.text()).then(content => {
          document.body.appendChild(Template.from(content));
        });
      }
    }
  });

  // Bootstrap Life Diary
  let fetching = false;

  const json = file => fetch(file).then(b => b.json());

  const cursor = {
    i: 0,
    char: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    next() {
      return this.char[this.i++ % this.char.length];
    }
  };

  const renderMedia = (where, album, files) => {
    const removeMedia = ({detail: file}) => {
      const i = files.indexOf(file);
      if (-1 < i) {
        files.splice(i, 1);
        renderMedia(where, album, files);
      }
    };
    render(where, html.for(files, 'album')`
      ${files.map(file => html.for(file, 'media-preview')`
        <ld-media-preview ondeleted=${removeMedia} .data=${file} />
      `)}
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

          progress.current.max = max;
          progress.current.value = value;
          progress.current.details = `processing 0/${length}`;
          upload.disabled = true;

          const fail = () => {
            uploadFile(length);
            alert(`Unable to upload ${uploads[i].name}`);
          };

          const uploadFile = i => {
            if (i === length) {
              fetching = false;
              upload.value = '';
              progress.current.details = '';
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
                if (file) {
                  files.unshift(file);
                  progress.current.details = `processing ${++i + 1}/${length}`;
                  renderMedia(list.current, album, files);
                  uploadFile(i);
                }
                else
                  fail();
              })
              .catch(fail);
            }
          };

          fetching = true;
          uploadFile(0);

          let frames = 0;
          (function update() {
            if (uploading) {
              value += (nextValue - value) * .02;
              progress.current.value = value;
              if (!(frames++ % 6))
                progress.current.spinner = cursor.next();
              requestAnimationFrame(update);
            }
            else {
              progress.current.value = 0;
              progress.current.spinner = '';
            }
          }());

        }, () => {
          alert('Please confirm lock-screen to upload');
        });
      };
      const list = {};
      const progress = {};
      render(main, html`
        <form class="album" onsubmit=${event => event.preventDefault()} method="post" action="/upload" enctype="multipart/form-data">
          <h1>${album}</h1>
          <fieldset>
            <legend>Upload new files</legend>
            <input onchange=${uploadFiles} type="file" name="upload" accept="audio/*,image/*,video/*" multiple required>
            <ld-progress ref=${progress} />
          </fieldset>
        </form>
        <div class="album" ref=${list}></div>
      `);
      renderMedia(list.current, album, files);
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
        history.pushState(null, album, `/album/${encodeURIComponent(value)}`);
        withUpload(value);
      }
    };
    render(main, html`
      <form onsubmit=${onNameChosen} method="post" action="/upload" enctype="multipart/form-data">
        <input name="album" placeholder="Album name" required autofocus>
        <input name="submit" type="submit">
      </form>
    `);
  };

  const showAlbum = event => {
    const {detail: album} = event;
    withUpload(album);
    history.pushState(null, album, `/album/${encodeURIComponent(album)}`);
  };

  const listAlbums = () => {
    json('/albums').then(albums => {
      render(main, html`
        <button onclick=${createAlbum}>Create a new album</button>
        <ul>
          ${albums.map(album => html`
            <li is="ld-album"
              ondeleted=${listAlbums}
              onvisualize=${showAlbum}
              .name=${album}
            />`
          )}
        </ul>
      `);
    });
  };

  const popstate = () => {
    if (/^\/album\/([^/]+?)$/.test(location.pathname))
      withUpload(decodeURIComponent(RegExp.$1));
    else
      listAlbums();
  };

  addEventListener('popstate', popstate);
  addEventListener('beforeunload', event => {
    if (fetching)
      return event.returnValue = 'PLEASE WAIT';
  });

  popstate();

});
