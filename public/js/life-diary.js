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
