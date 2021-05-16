import { Common } from '../src/Common';
import { StateException } from '../src/Exceptions/StateException';

describe('Common Module', function () {
  let common: Common = null;

  beforeEach(() => {
    common = new Common();
    common.reset('field', '', 0);
  });

  describe('#constructor()', function () {
    it(`should create a common instance`, function () {
      expect(new Common()).toBeInstanceOf(Common);
    });
  });

  describe('#setErrorBag(errorBag: ErrorBag)', function () {
    it(`should set the instance error bag and return the instance`, function () {
      expect(common.setErrorBag({})).toBeInstanceOf(Common);
    });
  });

  describe('#reset(field: string, value: SingleDataValue, index: number)', function () {
    it(`should reset the internals, and assign properties`, function () {
      expect(common.reset('field', '', 0)).toStrictEqual(common);
    });
  });

  describe('#setError(errorMessage: string | false, value: string)', function () {
    it(`should set error message for the current field under validation, returning false`, function () {
      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('field is required');
    });

    it(`should default error message to 'error occured' if the passed in value is false`, function () {
      expect(common.setError(false, '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('error occured');
    });

    it(`should throw exception if called twice for the same field under validation`, function () {
      expect(common.setError('field is required', '')).toBeFalsy();
      expect(function () {
        expect(common.setError('field is required', '')).toBeFalsy();
      }).toThrow(StateException);
    });

    it(`should replace every occurence of {name} in error message with the field name`, function () {
      expect(common.setError('{name} is required', '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('field is required');
    });

    it(`should replace every occurence of {value} in error message with the field value`, function () {
      expect(
        common.setError('{value} is not a valid integer', 'az')
      ).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('"az" is not a valid integer');
    });

    it(`should replace every occurence of {index} in error message with the field index`, function () {
      expect(
        common.setError('color number {index} is not valid', 'pruple')
      ).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('color number 1 is not valid');
    });

    it(`should leave placeholder untouched if it is neither {value}, {name} nor {index}`, function () {
      expect(
        common.setError('color number {_index} is not valid', 'pruple')
      ).toBeFalsy();
      expect(common.getErrorBag().field).toEqual(
        'color number {_index} is not valid'
      );
    });
  });

  describe('#succeeds()', function () {
    it(`should return false if there is an error message set`, function () {
      expect(common.succeeds()).toBeTruthy();

      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.succeeds()).toBeFalsy();
    });
  });

  describe('#fails()', function () {
    it(`should return true if there is an error message set`, function () {
      expect(common.fails()).toBeFalsy();

      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.fails()).toBeTruthy();
    });
  });
});
