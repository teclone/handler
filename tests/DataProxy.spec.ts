import DataProxy from '../src/DataProxy';

describe('Data Proxy', function() {
  describe('setter', function() {
    it(`should set data value if set operation is carried out`, function() {
      const target: { [p: string]: any } = {};
      const proxy = new Proxy<typeof target>(target, DataProxy);
      proxy.name = 'Harrison';

      expect(target.name).toEqual('Harrison');
    });
  });

  describe('getter', function() {
    it(`should return data value is a get operation is carried out`, function() {
      const target: { [p: string]: any } = {
        name: 'Harrison',
      };
      const proxy = new Proxy<typeof target>(target, DataProxy);

      expect(proxy.name).toEqual('Harrison');
    });
  });

  describe('toJSON call', function() {
    it(`should allow object to be stringified`, function() {
      const target: { [p: string]: any } = {
        name: 'Harrison',
      };
      const proxy = new Proxy<typeof target>(target, DataProxy);
      expect(JSON.stringify(proxy)).toEqual(JSON.stringify(target));
    });
  });
});
