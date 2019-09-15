import CustomDate from '../src/CustomDate';

describe('CustomDate', function() {
  describe('#constructor()', function() {
    it(`should create a CustomDate instance which inherits from Date when called`, function() {
      const date = new CustomDate();
      expect(date).toBeInstanceOf(CustomDate);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('.isValid()', function() {
    it(`should inspect the given date string and return false if date is not in correct format`, function() {
      expect(CustomDate.isValid('01-01-2014')).toBeFalsy();
    });
    it(`should inspect the given year, month and day date parameters, and return false
            if date is invalid`, function() {
      expect(CustomDate.isValid(2014, 13, 1)).toBeFalsy();
    });
  });

  describe('#toString()', function() {
    it(`should convert the date object using the format yyyy-mm-dd`, function() {
      expect(new CustomDate(2019, 0).toString()).toEqual('2019-01-01');
    });
  });
});
