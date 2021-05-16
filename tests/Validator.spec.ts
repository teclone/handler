import { Validator } from '../src/Validator';
import { createFile, getFilesDirectory } from './helpers';
import * as fs from 'fs';
import { FileException } from '../src/Exceptions/FileException';
import { Common } from '../src/Common';

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

  describe(`#validateText(field: string, value: string, index: number, options: TextOptions)`, function () {
    it(`should return true if validation succeeds`, function () {
      expect(validator.validateText('name', 'Harrison', 0, {})).toBeTruthy();
    });

    it(`should return false if field length is less than the specified min length`, function () {
      const minErr = '{name} should be at least 10 characters';
      expect(
        validator.validateText('name', 'Harrison', 0, {
          min: 10,
          minErr,
        })
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual(
        'name should be at least 10 characters'
      );
    });

    it(`should return false if field length is greater than the specified max length`, function () {
      const maxErr = '{name} should not be greater than 10 characters';
      expect(
        validator.validateText('name', 'Harrison Ifeanyichukwu', 0, {
          max: 10,
          maxErr,
        })
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual(
        'name should not be greater than 10 characters'
      );
    });

    it(`should return false if field length is not less than the specified lt option`, function () {
      const ltErr = '{name} should be less than 10 characters';
      expect(
        validator.validateText('name', 'Ifeanyichukwu', 0, {
          lt: 10,
          ltErr,
        })
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual(
        'name should be less than 10 characters'
      );
    });

    it(`should return true if field length is less than the specified lt option`, function () {
      const ltErr = '{name} should be less than 10 characters';
      expect(
        validator.validateText('name', 'Harrison', 0, {
          lt: 10,
          ltErr,
        })
      ).toBeTruthy();
    });

    it(`should return false if field value matches any of the regexNone rule`, function () {
      expect(
        validator.validateText('name', 'Harrison1', 0, {
          regexNone: [/\d/],
        })
      ).toBeFalsy();
    });

    it(`should return false if field value did not match any of the regexAny rule`, function () {
      expect(
        validator.validateText('name', 'Harry', 0, {
          regexAny: {
            patterns: [/^[a-z]{8}$/i, /^[a-z]{6}$/i],
            err: '{name} must be 8 or 6 characters long',
          },
        })
      ).toBeFalsy();
      expect(validator.getErrorBag().name).toEqual(
        'name must be 8 or 6 characters long'
      );
    });

    it(`should return true if field value did match any of the regexAny rule`, function () {
      expect(
        validator.validateText('name', 'Harrison', 0, {
          regexAny: {
            patterns: [/^[a-z]{8}$/i, /^[a-z]{6}$/i],
            err: '{name} must be 8 or 6 characters long',
          },
        })
      ).toBeTruthy();
    });
  });

  describe(`#validateObjectId(field: string, value: string, index: number, options: TextOptions)`, function () {
    it(`should return true if validation succeeds`, function () {
      expect(
        validator.validateObjectId('name', '531975a04179b4200064daf0', 0, {})
      ).toBeTruthy();
    });

    it(`should return fase if value is not a valid object id`, function () {
      expect(
        validator.validateObjectId('name', '531975a04179b4200064daf0ad', 0, {})
      ).toBeFalsy();
    });
  });

  describe(`#validateEmail(field: string, value: string, index: number, options: TextOptions)`, function () {
    it(`should return true if validation succeeds`, function () {
      expect(
        validator.validateEmail('email', 'someone@example.com', 0, {})
      ).toBeTruthy();
    });

    it(`should return false if validation succeeds`, function () {
      expect(
        validator.validateEmail('email', 'someone@example', 0, {})
      ).toBeFalsy();
    });
  });

  describe(`#validateURL(field: string, value: string, index: number, options: URLOptions)`, function () {
    it(`should return false if url must have scheme but has none`, function () {
      expect(
        validator.validateURL('url', 'www.example.com', 0, {
          mustHaveScheme: true,
        })
      ).toBeFalsy();
    });

    it(`should return true if url does not have scheme specified but scheme is not required`, function () {
      expect(
        validator.validateURL('url', 'www.example.com', 0, {})
      ).toBeTruthy();
    });

    it(`should return false if url is not valid`, function () {
      expect(validator.validateURL('url', 'example.a', 0, {})).toBeFalsy();
    });

    it(`should return false if url scheme is not part of allowed schemes`, function () {
      expect(
        validator.validateURL('url', 'ws://www.example.com', 0, {
          schemes: ['http', 'https'],
        })
      ).toBeFalsy();
    });

    it(`should return true if url scheme is part of allowed schemes and url is valid`, function () {
      expect(
        validator.validateURL('url', 'ws://www.example.com', 0, {
          schemes: ['ws', 'https'],
        })
      ).toBeTruthy();
    });
  });

  describe(`#validatePhoneNumber(field: string, value: string, index: number, options: PhoneNumberOptions)`, function () {
    it(`should return true if phone number is valid`, function () {
      expect(
        validator.validatePhoneNumber('phone-number', '+2348132083435', 0, {})
      ).toBeTruthy();
    });

    it(`should return false if phone number is valid but not for the given country`, function () {
      expect(
        validator.validatePhoneNumber('phone-number', '+2348132083435', 0, {
          country: 'US',
        })
      ).toBeFalsy();
    });

    it(`should return false if phone number does not have country code and no default country is specified`, function () {
      expect(
        validator.validatePhoneNumber('phone-number', '08132083435', 0, {})
      ).toBeFalsy();
    });
  });

  describe(`#validatePassword(field: string, value: string, index: number, options: PasswordOptions)`, function () {
    it(`should return false if password length is less than 8 and if preValidate is not disabled`, function () {
      expect(
        validator.validatePassword('password', 'anypas', 0, {})
      ).toBeFalsy();
    });

    it(`should return false if password length does not contain at least two letter characters if preValidate is not disabled`, function () {
      expect(
        validator.validatePassword('password', '12345678', 0, {})
      ).toBeFalsy();
    });

    it(`should return false if password length does not contain at least two non-letter characters if preValidate is not disabled`, function () {
      expect(
        validator.validatePassword('password', 'abcdefgh', 0, {})
      ).toBeFalsy();
    });

    it(`should run no pre validation if pre validation is disabled`, function () {
      expect(
        validator.validatePassword('password', 'abcdefgh', 0, {
          preValidate: false,
        })
      ).toBeTruthy();
    });

    it(`should return false if password did not match the defined shouldMatch option`, function () {
      expect(
        validator.validatePassword('password', 'random22', 0, {
          shouldMatch: {
            target: 'random33',
          },
        })
      ).toBeFalsy();
    });
  });

  describe(`#validateDate(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if date value is not in correct format`, function () {
      expect(validator.validateDate('dob', '01-01-2014', 0, {})).toBeFalsy();
      expect(validator.getErrorBag().dob).toEqual(
        '01-01-2014 is not a correct date format'
      );
    });

    it(`should return false if date value is not valid`, function () {
      expect(validator.validateDate('dob', '2014-13-01', 0, {})).toBeFalsy();
      expect(validator.getErrorBag().dob).toEqual(
        '2014-13-01 is not a valid date'
      );
    });

    it(`should return true if date value is valid`, function () {
      expect(validator.validateDate('dob', '2014-01-01', 0, {})).toBeTruthy();
    });
  });

  describe(`#validateInt(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not an integer`, function () {
      expect(validator.validateInt('id', 'a', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid integer`, function () {
      expect(validator.validateInt('id', '20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validatePInt(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not a valid positive integer`, function () {
      expect(validator.validatePInt('id', '-1', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid positive integer`, function () {
      expect(validator.validatePInt('id', '20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validateNInt(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not a valid negative integer`, function () {
      expect(validator.validateNInt('id', '1', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid negative integer`, function () {
      expect(validator.validateNInt('id', '-20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validateNumber(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not a number`, function () {
      expect(validator.validateNumber('amount', '20k', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid number`, function () {
      expect(validator.validateNumber('amount', '-20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validatePNumber(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not a valid positive number`, function () {
      expect(validator.validatePNumber('amount', '-20', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid positive number`, function () {
      expect(validator.validatePNumber('amount', '20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validateNNumber(field: string, value: string, index: number, options: NumberOptions)`, function () {
    it(`should return false if field value is not a valid negative number`, function () {
      expect(validator.validateNNumber('amount', '20', 0, {})).toBeFalsy();
    });

    it(`should return true if field value is a valid negative number`, function () {
      expect(validator.validateNNumber('amount', '-20', 0, {})).toBeTruthy();
    });
  });

  describe(`#validateChoice(field: string, value: string, index: number, options: ChoiceOptions)`, function () {
    const choices = ['Nigeria', 'Poland', 'Finland', 'Germany'];

    it(`should return false if field value is not a valid choice`, function () {
      expect(
        validator.validateChoice('country', 'Kenya', 0, {
          choices,
        })
      ).toBeFalsy();
    });

    it(`should return true if field value is a valid choice`, function () {
      expect(
        validator.validateChoice('country', 'Nigeria', 0, {
          choices,
        })
      ).toBeTruthy();
    });
  });

  describe(`#validateRange(field: string, value: string, index: number, options: RangeOptions)`, function () {
    it(`should return true if field value is a valid range`, function () {
      expect(
        validator.validateRange('digit', '1', 0, {
          from: 1,
          to: 10,
        })
      ).toBeTruthy();
    });

    it(`should return false if field value is not a valid range`, function () {
      expect(
        validator.validateRange('digit', '1', 0, {
          from: 'a',
          to: 'z',
        })
      ).toBeFalsy();
    });
  });

  describe(`async #validateFile(field: string, file: FileEntry index: number, options: FileOptions, category?: string | string[], label?: string)`, function () {
    it(`should return false if file size did not meet size specifications`, function () {
      const file = createFile();

      return validator
        .validateFile('file', file, 0, {
          min: file.size + 1000000,
        })
        .then((status) => {
          expect(status).toBeFalsy();
        });
    });

    it(`should return false if file extension is not allowed`, function () {
      const file = createFile();

      return validator
        .validateFile('file', file, 0, {
          exts: ['jpg', 'png'],
        })
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().file).toEqual(
            '.pdf files are not allowed'
          );
        });
    });

    it(`should move file after validation if the moveTo option is specified and it is string`, function () {
      const file = createFile();
      const moveTo = getFilesDirectory();

      const clonedFile = {
        ...file,
      };

      return validator
        .validateFile('file', clonedFile, 0, { moveTo })
        .then((status) => {
          expect(status).toBeTruthy();

          expect(fs.existsSync(clonedFile.path)).toBeTruthy();

          // move it back, basically unmove it
          fs.renameSync(clonedFile.path, file.path);
        });
    });

    it(`should call the moveTo callback function if specified with the file object`, function () {
      const callback = jest.fn<Promise<true | string>, any[]>(async (value) => {
        return true;
      });
      const file = createFile();

      return validator
        .validateFile('file', file, 0, { moveTo: callback })
        .then((status) => {
          expect(callback.mock.calls.length).toEqual(1);
        });
    });

    it(`should throw error if error occurs while moving file`, function () {
      const file = createFile();
      const moveTo = 'some/unknown/directory';

      return validator
        .validateFile('file', file, 0, { moveTo })
        .catch((ex) => ex)
        .then((ex) => {
          expect(ex).toBeInstanceOf(FileException);
        });
    });
  });

  describe(`async #validateImage(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate image files`, function () {
      return validator
        .validateImage('image', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().image).toEqual(
            '"test.pdf" is not an image file'
          );
        });
    });
  });

  describe(`async #validateAudio(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate audio files`, function () {
      return validator
        .validateAudio('audio', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().audio).toEqual(
            '"test.pdf" is not an audio file'
          );
        });
    });
  });

  describe(`async #validateVideo(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate video files`, function () {
      return validator
        .validateVideo('video', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().video).toEqual(
            '"test.pdf" is not a video file'
          );
        });
    });
  });

  describe(`async #validateMedia(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate media files`, function () {
      return validator
        .validateMedia('media', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().media).toEqual(
            '"test.pdf" is not a media file'
          );
        });
    });
  });

  describe(`async #validateDocument(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate document files`, function () {
      return validator
        .validateDocument('document', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeTruthy();
        });
    });
  });

  describe(`async #validateArchive(field: string, value: FileEntry, index: number, options: FileOptions)`, function () {
    it(`should validate archive files`, function () {
      return validator
        .validateArchive('archive', createFile(), 0, {})
        .then((status) => {
          expect(status).toBeFalsy();
          expect(validator.getErrorBag().archive).toEqual(
            '.pdf files are not allowed'
          );
        });
    });
  });
});
