if (!navigator.wakeLock) {
  import('./3rd/NoSleep.js').then(({NoSleep}) => {
    const noSleep = new NoSleep();
    navigator.wakeLock = {request() {
      noSleep.enable();
      return Promise.resolve({release() {
        noSleep.disable();
      }});
    }};
  });
}
