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

class Menu {
  constructor(items) {
    this.items = items;
    this.visible = false;
    this.ul = null;
  }
  handleEvent(event) {
    this['on' + event.type](event);
  }
  isMenuClick(event) {
    const {currentTarget, target, eventPhase} = event;
    let result = 0;
    if (eventPhase === 1)
      result = target.closest('.contextmenu') ? 1 : 0;
    else if (currentTarget.ownerDocument)
      result = 2;
    if (result) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    return result;
  }
  onclick(event) {
    const {items, ul, visible} = this;
    if (visible) {
      const click = this.isMenuClick(event);
      if (click) {
        const target = click < 2 ? event.target.closest('.item') : event.currentTarget;
        const item = items[items.indexOf.call(ul.children, target)];
        if (item.action)
          item.action(event);
      }
      this.hide();
    }
  }
  oncontextmenu(event) {
    if (this.isMenuClick(event)) {
      const {currentTarget} = event;
      const {ownerDocument} = currentTarget;
      if (!this.ul)
        this.init(ownerDocument, currentTarget);
      this.show(event);
    }
    else if (this.visible)
      this.hide();
  }
  ontransitionend() {
    if (!this.visible)
      this.ul.style.display = 'none';
  }
  init(document, target) {
    const {items} = this;
    const ul = (this.ul = document.createElement('ul'));
    ul.className = 'contextmenu';
    for (let i = 0, {length} = items; i < length; i++) {
      const li = ul.appendChild(document.createElement('li'));
      const item = items[i];
      if (item instanceof Node)
        li.appendChild(item);
      else {
        if (item.text)
          li.textContent = item.text;
        else
          li.innerHTML = item.html;
        li.className = 'item';
        if (item.class)
          li.className += ' ' + item.class;
      }
      li.addEventListener('click', this);
    }
    ul.style.cssText = [
      'position:fixed',
      'z-index:999999',
      'margin:0',
      'padding:0',
      'list-style:none',
      'display:none',
      'transition:opacity .1s ease-in'
    ].join(';');
    ul.addEventListener('transitionend', this);
    target.parentElement.insertBefore(ul, target);
  }
  show({clientX, clientY}) {
    this.visible = true;
    const {style} = this.ul;
    style.opacity = 0;
    style.top = clientY + 'px';
    style.left = clientX + 'px';
    style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.opacity = 1;
      })
    });
  }
  hide() {
    this.visible = false;
    this.ul.style.opacity = 0;
  }
}

export default (currentTarget, items) => {
  const {ownerDocument} = currentTarget;
  const menu = new Menu(items);
  currentTarget.addEventListener('contextmenu', menu);
  ownerDocument.addEventListener('contextmenu', menu);
  ownerDocument.addEventListener('click', menu, true);
  return () => {
    currentTarget.removeEventListener('contextmenu', menu);
    ownerDocument.removeEventListener('contextmenu', menu);
    ownerDocument.removeEventListener('click', menu, true);
    menu.ul.remove();
  };
};
