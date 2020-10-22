const json = file => fetch(file).then(b => b.json());

const title = 'Life Diary ❤️';

export default ({render, html, main, fullscreen}) => {

  const listAlbums = () => {
    json('/albums').then(albums => {
      history.pushState(null, title, '/');
      const data = {albums, showAlbum, listAlbums};
      render(main, html`<ld-home .data=${data} />`);
    });
  };

  const showAlbum = album => {
    json(`/album/${encodeURIComponent(album)}.json`).then(files => {
      history.pushState(null, `${title} ${album}`, `/album/${album}`);
      const data = {
        album, files, fullscreen, listAlbums,
        set fetching(value) {
          lifeDiary.fetching = value;
        }
      };
      render(main, html`<ld-album .data=${data} />`);
    });
  };

  const lifeDiary = {
    fetching: false,
    listAlbums,
    showAlbum
  };

  return lifeDiary;
};
