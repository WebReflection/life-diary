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
    this.clientX = 0;
    this.moveX = 0;
  }
  handleEvent(event) {
    this['on' + event.type](event);
  }
  onpointerdown(event) {
    stop(event);
    if (!this.swiping)
      this.clientX = event.clientX;
  }
  onpointermove(event) {
    const {clientX} = event;
    if (this.swiping) {
      stop(event);
      this.moveX = clientX - this.clientX;
    }
    else if (treshold <= abs(this.clientX - clientX)) {
      this.clientX = clientX;
      this.swiping = true;
    }
  }
  onpointerup(event) {
    if (this.swiping) {
      stop(event);
      this.swiping = false;
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
