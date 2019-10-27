import Validator from '../src/Validator';
import { createFile, getFilesDirectory } from './helpers';
import * as fs from 'fs';
import FileException from '../src/Exceptions/FileException';
import Common from '../src/Common';

describe('Validator', function () {
  let validator: Validator = null;

  beforeEach(function () {
    validator = new Validator();
  });

  describe('#constructor()', function () {
    it(`should create a validator instance when called`, function () {
      expect(new Validator()).toBeInstanceOf(Validator);
    });

    it(`should inherit from Common module`, function () {
      expect(new Validator()).toBeInstanceOf(Common);
    });
  });

  describe(`#validateText(required: boolean, field: string, value: string, options: TextOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateText(false, 'name', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateText(true, 'name', '', {}, 0)).toBeFalsy();
    });

    it(`should return true if validation succeeds`, function () {
      expect(validator.validateText(true, 'name', 'Harrison', {}, 0)).toBeTruthy();
    });

    it(`should return false if field length is less than the specified min option`, function () {
      const minErr = '{_this} should be at least 10 characters';
      expect(
        validator.validateText(
          true,
          'name',
          'Harrison',
          {
            min: 10,
            minErr,
          },
          0
        )
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual('name should be at least 10 characters');
    });

    it(`should return false if field length is greater than the specified max option`, function () {
      const maxErr = '{_this} should not be greater than 10 characters';
      expect(
        validator.validateText(
          true,
          'name',
          'Harrison Ifeanyichukwu',
          {
            max: 10,
            maxErr,
          },
          0
        )
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual('name should not be greater than 10 characters');
    });

    it(`should return false if field length is not less than the specified lt option`, function () {
      const ltErr = '{_this} should be less than 10 characters';
      expect(
        validator.validateText(
          true,
          'name',
          'Ifeanyichukwu',
          {
            lt: 10,
            ltErr,
          },
          0
        )
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual('name should be less than 10 characters');
    });

    it(`should return true if field length is less than the specified lt option`, function () {
      const ltErr = '{_this} should be less than 10 characters';
      expect(
        validator.validateText(
          true,
          'name',
          'Harrison',
          {
            lt: 10,
            ltErr,
          },
          0
        )
      ).toBeTruthy();
    });

    it(`should return false if field value matches any of the regexNone rule`, function () {
      expect(
        validator.validateText(
          true,
          'name',
          'Harrison1',
          {
            regexNone: [/\d/],
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return false if field value did not match any of the regexAny rule`, function () {
      expect(
        validator.validateText(
          true,
          'name',
          'Harry',
          {
            regexAny: {
              patterns: [/^[a-z]{8}$/i, /^[a-z]{6}$/i],
              err: '{_this} must be 8 or 6 characters long',
            },
          },
          0
        )
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual('name must be 8 or 6 characters long');
    });

    it(`should return true if field value did match any of the regexAny rule`, function () {
      expect(
        validator.validateText(
          true,
          'name',
          'Harrison',
          {
            regexAny: {
              patterns: [/^[a-z]{8}$/i, /^[a-z]{6}$/i],
              err: '{_this} must be 8 or 6 characters long',
            },
          },
          0
        )
      ).toBeTruthy();
    });
  });

  describe(`#validateObjectId(required: boolean, field: string, value: string, options: TextOptions,
    index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateObjectId(false, 'name', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateObjectId(true, 'name', '', {}, 0)).toBeFalsy();
    });

    it(`should return true if validation succeeds`, function () {
      expect(validator.validateObjectId(true, 'name', '531975a04179b4200064daf0', {}, 0)).toBeTruthy();
    });

    it(`should return fase if value is not a valid object id`, function () {
      expect(validator.validateObjectId(true, 'name', '531975a04179b4200064daf0ad', {}, 0)).toBeFalsy();
    });
  });

  describe(`#validateEmail(required: boolean, field: string, value: string, options: TextOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateEmail(false, 'email', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateEmail(true, 'email', '', {}, 0)).toBeFalsy();
    });

    it(`should return true if validation succeeds`, function () {
      expect(validator.validateEmail(true, 'email', 'someone@example.com', {}, 0)).toBeTruthy();
    });

    it(`should return false if validation succeeds`, function () {
      expect(validator.validateEmail(true, 'email', 'someone@example', {}, 0)).toBeFalsy();
    });
  });

  describe(`#validateURL(required: boolean, field: string, value: string, options: URLOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateURL(false, 'url', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateURL(true, 'url', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if url must have scheme but has none`, function () {
      expect(
        validator.validateURL(
          true,
          'url',
          'www.example.com',
          {
            mustHaveScheme: true,
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return true if url does not have scheme specified but scheme is not required`, function () {
      expect(validator.validateURL(true, 'url', 'www.example.com', {}, 0)).toBeTruthy();
    });

    it(`should return false if url is not valid`, function () {
      expect(validator.validateURL(true, 'url', 'example.a', {}, 0)).toBeFalsy();
    });

    it(`should return false if url scheme is not part of allowed schemes`, function () {
      expect(
        validator.validateURL(
          true,
          'url',
          'ws://www.example.com',
          {
            schemes: ['http', 'https'],
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return true if url scheme is part of allowed schemes and url is valid`, function () {
      expect(
        validator.validateURL(
          true,
          'url',
          'ws://www.example.com',
          {
            schemes: ['ws', 'https'],
          },
          0
        )
      ).toBeTruthy();
    });
  });

  describe(`#validatePhoneNumber(required: boolean, field: string, value: string, options: PhoneNumberOptions,
        index: number)`, function () {
    it(`should return true if phone number is empty and optional`, function () {
      expect(validator.validatePhoneNumber(false, 'phone-number', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateNumber(true, 'phone-number', '', {}, 0)).toBeFalsy();
    });

    it(`should return true if phone number is valid for any country`, function () {
      expect(validator.validatePhoneNumber(true, 'phone-number', '+2348132083435', {}, 0)).toBeTruthy();
    });

    it(`should return false if phone number is valid but not for the given country`, function () {
      expect(validator.validatePhoneNumber(true, 'phone-number', '+2348132083435', { country: 'us' }, 0)).toBeFalsy();
    });

    it(`should return false if phone number is not an international one and no default country is specified`, function () {
      expect(validator.validatePhoneNumber(true, 'phone-number', '08132083435', {}, 0)).toBeFalsy();
    });
  });

  describe(`#validatePassword(required: boolean, field: string, value: string, options: PasswordOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validatePassword(false, 'password', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validatePassword(true, 'password', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if password length is less than 8 if preValidate is not disabled`, function () {
      expect(validator.validatePassword(true, 'password', 'anypas', {}, 0)).toBeFalsy();
    });

    it(`should return false if password length does not contain at least two letter characters
            if preValidate is not disabled`, function () {
      expect(validator.validatePassword(true, 'password', '12345678', {}, 0)).toBeFalsy();
    });

    it(`should return false if password length does not contain at least two non-letter characters
            if preValidate is not disabled`, function () {
      expect(validator.validatePassword(true, 'password', 'abcdefgh', {}, 0)).toBeFalsy();
    });

    it(`should run no pre validation if pre validation is disabled`, function () {
      expect(
        validator.validatePassword(
          true,
          'password',
          'abcdefgh',
          {
            preValidate: false,
          },
          0
        )
      ).toBeTruthy();
    });

    it(`should return false if password did not match the defined shouldMatch option`, function () {
      expect(
        validator.validatePassword(
          true,
          'password',
          'random22',
          {
            shouldMatch: {
              target: 'random33',
            },
          },
          0
        )
      ).toBeFalsy();
    });
  });

  describe(`#validateDate(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateDate(false, 'dob', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateDate(true, 'dob', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if date value is not in correct format`, function () {
      expect(validator.validateDate(true, 'dob', '01-01-2014', {}, 0)).toBeFalsy();
      expect(validator.getErrorBag().dob).toEqual('01-01-2014 is not a correct date format');
    });

    it(`should return false if date value is not valid`, function () {
      expect(validator.validateDate(true, 'dob', '2014-13-01', {}, 0)).toBeFalsy();
      expect(validator.getErrorBag().dob).toEqual('2014-13-01 is not a valid date');
    });

    it(`should return true if date value is valid`, function () {
      expect(validator.validateDate(true, 'dob', '2014-01-01', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validateInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateInt(false, 'id', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateInt(true, 'id', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not an integer`, function () {
      expect(validator.validateInt(true, 'id', 'a', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid integer`, function () {
      expect(validator.validateInt(true, 'id', '20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validatePInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validatePInt(false, 'id', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validatePInt(true, 'id', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not a valid positive integer`, function () {
      expect(validator.validatePInt(true, 'id', '-1', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid positive integer`, function () {
      expect(validator.validatePInt(true, 'id', '20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validateNInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateNInt(false, 'id', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateNInt(true, 'id', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not a valid negative integer`, function () {
      expect(validator.validateNInt(true, 'id', '1', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid negative integer`, function () {
      expect(validator.validateNInt(true, 'id', '-20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validateNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateNumber(false, 'amount', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateNumber(true, 'amount', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not a number`, function () {
      expect(validator.validateNumber(true, 'amount', '20k', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid number`, function () {
      expect(validator.validateNumber(true, 'amount', '-20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validatePNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validatePNumber(false, 'amount', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validatePNumber(true, 'amount', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not a valid positive number`, function () {
      expect(validator.validatePNumber(true, 'amount', '-20', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid positive number`, function () {
      expect(validator.validatePNumber(true, 'amount', '20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validateNNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(validator.validateNNumber(false, 'amount', '', {}, 0)).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(validator.validateNNumber(true, 'amount', '', {}, 0)).toBeFalsy();
    });

    it(`should return false if field value is not a valid negative number`, function () {
      expect(validator.validateNNumber(true, 'amount', '20', {}, 0)).toBeFalsy();
    });

    it(`should return true if field value is a valid negative number`, function () {
      expect(validator.validateNNumber(true, 'amount', '-20', {}, 0)).toBeTruthy();
    });
  });

  describe(`#validateChoice(required: boolean, field: string, value: string, options: ChoiceOptions,
        index: number)`, function () {
    const choices = ['Nigeria', 'Poland', 'Finland', 'Germany'];

    it(`should return true if field value is empty and optional`, function () {
      expect(
        validator.validateChoice(
          false,
          'country',
          '',
          {
            choices,
          },
          0
        )
      ).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(
        validator.validateChoice(
          true,
          'country',
          '',
          {
            choices,
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return false if field value is not a valid choice`, function () {
      expect(
        validator.validateChoice(
          true,
          'country',
          'Kenya',
          {
            choices,
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return true if field value is a valid choice`, function () {
      expect(
        validator.validateChoice(
          true,
          'country',
          'Nigeria',
          {
            choices,
          },
          0
        )
      ).toBeTruthy();
    });
  });

  describe(`#validateRange(required: boolean, field: string, value: string, options: RangeOptions,
        index: number)`, function () {
    it(`should return true if field value is empty and optional`, function () {
      expect(
        validator.validateRange(
          false,
          'letter',
          '',
          {
            from: 'a',
            to: 'z',
          },
          0
        )
      ).toBeTruthy();
    });

    it(`should return false if field value is empty but required`, function () {
      expect(
        validator.validateRange(
          true,
          'digit',
          '',
          {
            from: 1,
            to: 10,
          },
          0
        )
      ).toBeFalsy();
    });

    it(`should return true if field value is a valid choice`, function () {
      expect(
        validator.validateRange(
          true,
          'digit',
          '1',
          {
            from: 1,
            to: 10,
          },
          0
        )
      ).toBeTruthy();
    });

    it(`should return false if field value is not a valid choice`, function () {
      expect(
        validator.validateRange(
          true,
          'digit',
          '1',
          {
            from: 'a',
            to: 'z',
          },
          0
        )
      ).toBeFalsy();
    });
  });

  describe(`async #validateFile(required: boolean, field: string, file: FileEntry | '', options: FileOptions,
        index: number, category?: string | string[], label?: string)`, function () {
    it(`should return true if file is not sent but optional`, function () {
      return validator.validateFile(false, 'file', '', {}, 0).then(status => {
        expect(status).toBeTruthy();
      });
    });

    it(`should return false if file is not sent but required`, function () {
      return validator.validateFile(true, 'file', '', {}, 0).then(status => {
        expect(status).toBeFalsy();
      });
    });

    it(`should return false if file size did not meet size specifications`, function () {
      const file = createFile();

      return validator
        .validateFile(
          true,
          'file',
          file,
          {
            min: file.size + 1000000,
          },
          0
        )
        .then(status => {
          expect(status).toBeFalsy();
        });
    });

    it(`should return false if file extension is not allowed`, function () {
      const file = createFile();

      return validator
        .validateFile(
          true,
          'file',
          file,
          {
            exts: ['jpg', 'png'],
          },
          0
        )
        .then(status => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().file).toEqual('.pdf files are not allowed');
        });
    });

    it(`should move file after validation if the moveTo option is specified and it is string`, function () {
      const file = createFile();
      const moveTo = getFilesDirectory();

      const clonedFile = {
        ...file,
      };

      return validator.validateFile(true, 'file', clonedFile, { moveTo }, 0).then(status => {
        expect(status).toBeTruthy();

        expect(fs.existsSync(clonedFile.path)).toBeTruthy();

        fs.renameSync(clonedFile.path, file.path);
      });
    });

    it(`should call the moveTo callback function if specified with the file object`, function () {
      const callback = jest.fn<Promise<true | string>, any[]>(async value => {
        return true;
      });
      const file = createFile();

      return validator.validateFile(true, 'file', file, { moveTo: callback }, 0).then(status => {
        expect(callback.mock.calls.length).toEqual(1);
      });
    });

    it(`should throw error if error occurs while moving file`, function () {
      const file = createFile();
      const moveTo = 'some/unknown/directory';

      return validator
        .validateFile(true, 'file', file, { moveTo }, 0)
        .catch(ex => ex)
        .then(ex => {
          expect(ex).toBeInstanceOf(FileException);
        });
    });
  });

  describe(`async #validateImage(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate image files`, function () {
      return validator.validateImage(true, 'image', createFile(), {}, 0).then(status => {
        expect(status).toBeFalsy();
        expect(validator.getErrorBag().image).toEqual('"test.pdf" is not an image file');
      });
    });
  });

  describe(`async #validateAudio(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate audio files`, function () {
      return validator.validateAudio(true, 'audio', createFile(), {}, 0).then(status => {
        expect(status).toBeFalsy();
        expect(validator.getErrorBag().audio).toEqual('"test.pdf" is not an audio file');
      });
    });
  });

  describe(`async #validateVideo(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate video files`, function () {
      return validator.validateVideo(true, 'video', createFile(), {}, 0).then(status => {
        expect(status).toBeFalsy();
        expect(validator.getErrorBag().video).toEqual('"test.pdf" is not a video file');
      });
    });
  });

  describe(`async #validateMedia(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate media files`, function () {
      return validator.validateMedia(true, 'media', createFile(), {}, 0).then(status => {
        expect(status).toBeFalsy();
        expect(validator.getErrorBag().media).toEqual('"test.pdf" is not a media file');
      });
    });
  });

  describe(`async #validateDocument(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate document files`, function () {
      return validator.validateDocument(true, 'document', createFile(), {}, 0).then(status => {
        expect(status).toBeTruthy();
      });
    });
  });

  describe(`async #validateArchive(required: boolean, field: string, value: string, options: FileOptions,
        index: number)`, function () {
    it(`should validate archive files`, function () {
      return validator.validateArchive(true, 'archive', createFile(), {}, 0).then(status => {
        expect(status).toBeFalsy();
        expect(validator.getErrorBag().archive).toEqual('.pdf files are not allowed');
      });
    });
  });
});
