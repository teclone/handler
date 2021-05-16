import { dateConverter } from '../src/Util';
import { CustomDate } from '../src/CustomDate';
import { InvalidDateException } from '../src/Exceptions/InvalidDateException';

describe('Util', function () {
  describe('.dateConverter(value: string)', function () {
    it(`should check if the given value is a valid date and return the date as object`, function () {
      expect(dateConverter('2019-01-01')).toBeInstanceOf(CustomDate);
    });

    it(`should throw Invalid date exception if the given date value is not a valid date`, function () {
      expect(() => {
        dateConverter('2019-13-01');
      }).toThrow(InvalidDateException);
    });
  });
});
