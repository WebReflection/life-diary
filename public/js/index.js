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

Promise.all([
  import('./life-diary.js'),
  import('./3rd/uce-loader.js'),
  import('./3rd/uce-template.js'),
  // import('https://unpkg.com/uce-template?module'),
  import('./wake-lock.js')
]).then(([{default: setup}, {loader}]) => {

  // Autoload .uce Components
  const Template = customElements.get('uce-template');
  loader({
    on(name) {
      if (name !== 'uce-template') {
        fetch(`/comp/${name}.html`).then(b => b.text()).then(content => {
          document.body.appendChild(Template.from(content));
        });
      }
    }
  });

  // Bootstrap Life Diary
  const {render, html} = customElements.get('uce-lib');
  const lifeDiary = setup({
    render, html,
    main: document.querySelector('main'),
    fullscreen: document.querySelector('footer')
  });

  const popstate = () => {
    if (/^\/album\/([^/]+?)$/.test(location.pathname))
      lifeDiary.showAlbum(decodeURIComponent(RegExp.$1));
    else
      lifeDiary.listAlbums();
  };

  addEventListener('popstate', popstate);
  addEventListener('beforeunload', event => {
    if (lifeDiary.fetching)
      return event.returnValue = 'PLEASE WAIT';
  });

  popstate();

});
