export const safeTypeOf = (thing) => {
  const value = Object.prototype.toString.call(thing);
  const rxVal = /\[object\s([^]+)\]()/g.exec(value);
  if (rxVal) {
    return rxVal[1];
  }
  const nospaces = value.split(" ");
  if (nospaces.length > 0) {
    return nospaces[1].split("]")[0];
  }
};
export const isOfType = (thing, expectedType) => {
  const regex = new RegExp(expectedType.name);
  const actualType = safeTypeOf(thing);
  return regex.test(actualType);
};
export const ensureType = (thing, expectedType, source) => {
  const actualType = safeTypeOf(thing);
  if (!isOfType(thing, expectedType)) {
    const prefix = (source && `${source} expected`) || "Expected";
    throw new Error(
      `${prefix} ${thing} to be of type ${expectedType.name} but got ${actualType}`
    );
  }
  return thing;
};

export const isString = (thing) => isOfType(thing, String);
export const isFunction = (thing) => isOfType(thing, Function);
