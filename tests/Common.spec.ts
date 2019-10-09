import Common from '../src/Common';
import StateException from '../src/Exceptions/StateException';

describe('Common Module', function() {
  let common: Common = null;

  beforeEach(() => {
    common = new Common();
  });

  describe('#constructor()', function() {
    it(`should create a common instance`, function() {
      expect(new Common()).toBeInstanceOf(Common);
    });
  });

  describe('#setErrorBag(errorBag: ErrorBag)', function() {
    it(`should set the instance error bag and return this`, function() {
      expect(common.setErrorBag({})).toBeInstanceOf(Common);
    });
  });

  describe('#reset(field: string, options: Options | DBCheck, index: number)', function() {
    it(`should reset the internals, and assign properties`, function() {
      expect(common.reset('field', {}, 0)).toStrictEqual(common);
    });
  });

  describe('#setError(errorMessage: string | false, value: string)', function() {
    it(`should set error message for the current field under validation, returning false`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('field is required');
    });

    it(`should default error message to 'error occured' if passed in value is false`, function() {
      common.reset('field', {}, 0);
      expect(common.setError(false, '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('error occured');
    });

    it(`should throw exception if called twice for the same field under validation`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('field is required', '')).toBeFalsy();
      expect(function() {
        expect(common.setError('field is required', '')).toBeFalsy();
      }).toThrow(StateException);
    });

    it(`should replace every occurence of {_this} in error message with the field name`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('{_this} is required', '')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('field is required');
    });

    it(`should replace every occurence of {this} in error message with the field value`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('{this} is not a valid integer', 'az')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('"az" is not a valid integer');
    });

    it(`should replace every occurence of {_index} in error message with the field index`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('color number {_index} is not valid', 'pruple')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('color number 1 is not valid');
    });

    it(`should leave placeholder untouched if it is neither {this}, {_this} nor {_index}`, function() {
      common.reset('field', {}, 0);
      expect(common.setError('color number {index} is not valid', 'pruple')).toBeFalsy();
      expect(common.getErrorBag().field).toEqual('color number {index} is not valid');
    });
  });

  describe('#succeeds()', function() {
    it(`should return false if there is an error message set`, function() {
      common.reset('field', {}, 0);
      expect(common.succeeds()).toBeTruthy();

      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.succeeds()).toBeFalsy();
    });
  });

  describe('#fails()', function() {
    it(`should return true if there is an error message set`, function() {
      common.reset('field', {}, 0);
      expect(common.fails()).toBeFalsy();

      expect(common.setError('field is required', '')).toBeFalsy();
      expect(common.fails()).toBeTruthy();
    });
  });
});
