if (!navigator.wakeLock) {
  import('./NoSleep.js').then(() => {
    const noSleep = new NoSleep();
    navigator.wakeLock = {request() {
      noSleep.enable();
      return Promise.resolve({release() {
        noSleep.disable();
      }});
    }};
  });
}
