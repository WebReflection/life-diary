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

const {abs} = Math;

const treshold = 16;

const stop = event => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

class Swiped {
  constructor({left, right}) {
    this.left = left;
    this.right = right;
    this.swiping = false;
    this.pointing = false;
    this.clientX = 0;
    this.moveX = 0;
  }
  handleEvent(event) {
    this['on' + event.type](event);
  }
  onpointerdown(event) {
    if (!this.pointing) {
      stop(event);
      this.pointing = true;
      this.swiping = false;
      this.moveX = 0;
      this.clientX = event.clientX;
    }
  }
  onpointermove(event) {
    if (this.pointing) {
      stop(event);
      const {clientX} = event;
      if (this.swiping)
        this.moveX = clientX - this.clientX;
      else if (treshold <= abs(this.clientX - clientX)) {
        this.clientX = clientX;
        this.swiping = true;
      }
    }
  }
  onpointerup(event) {
    if (this.pointing) {
      stop(event);
      this.pointing = false;
      if ((treshold * 2) <= abs(this.moveX)) {
        if (this.moveX < 0)
          this.left();
        else
          this.right();
      }
    }
  }
  onpointercancel() {
    if (this.swiping)
      this.swiping = false;
  }
}

export default (currentTarget, handlers) => {
  const swiped = new Swiped(handlers);
  const events = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
  for (const type of events)
    currentTarget.addEventListener(type, swiped);
  return () => {
    for (const type of events)
      currentTarget.removeEventListener(type, swiped);
  };
};
