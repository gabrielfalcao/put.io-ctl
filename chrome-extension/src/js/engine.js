const CLOCKS = {};

export const getClockNames = () => Object.keys(CLOCK);

export const addClock = (callback, interval, name) => {
  if (CLOCKS[name]) {
    console.error(`Cannot add clock: "${name}" already exists`);
    return;
  }
  CLOCKS[name] = setInterval(callback, interval);
};
export const removeClock = (name) => {
  const handle = CLOCKS[name];
  if (handle) {
    clearInterval(handle);
    delete CLOCKS[name];
  }
};

export const clearClocks = () => {
  for (const [name, _] of Object.entries(CLOCKS)) {
    if (CLOCKS[name]) {
      destroyClock(name);
    }
  }
};
