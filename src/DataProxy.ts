export const DataProxy = {
  set(target: object, prop: string | number | symbol, value: any) {
    return Reflect.set(target, prop, value);
  },

  get(target: object, prop) {
    if (prop in target) {
      return target[prop];
    } else if (prop === 'toJSON' || prop === 'toObject') {
      return undefined;
    } else if (typeof prop === 'symbol') {
      return target;
    } else {
      return undefined;
    }
  },
};
