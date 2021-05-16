import { Common } from './Common';
import { Options, Unit, DateConverter, RegexObject, Regex } from './@types';
import { CustomDate } from './CustomDate';
import {
  isUndefined,
  expandToNumeric,
  convertToMemoryUnit,
  pickValue,
  makeArray,
  range,
  isString,
  isNull,
  isObject,
  isRegex,
  isCallable,
} from '@teclone/utils';
import {
  DATE_FORMAT,
  URL_SCHEMES,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  DEFAULT_DOCUMENT_FILES,
  DEFAULT_ARCHIVE_FILES,
} from './Constants';
import { dateConverter } from './Util';
import {
  TextOptions,
  URLOptions,
  PasswordOptions,
  PhoneNumberOptions,
} from './@types/rules/TextRules';
import { NumberOptions } from './@types/rules/NumberRules';
import { ChoiceOptions } from './@types/rules/ChoiceRule';
import { RangeOptions } from './@types/rules/RangeRule';
import { FileOptions } from './@types/rules/FilesRule';
import { fromFile } from 'file-type';
import * as fs from 'fs';
import * as path from 'path';
import { FileException } from './Exceptions/FileException';
import {
  parsePhoneNumber,
  CountryCode,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { SuccessOrErrorMessage } from './@types/rules/BaseRule';
import { FileEntry } from '@teclone/r-server/lib/@types';

export class Validator<F extends string = string> extends Common<F> {
  private phoneNumberErrors = {
    INVALID_COUNTRY: 'invalid phone number country code',

    NOT_A_NUMBER: '{value} is not a phone number',

    TOO_LONG: 'phone number is too long',

    TOO_SHORT: 'phone number too short',
  };

  /**
   * gets the file type of the given file
   * @param filePath
   */
  private getFileType(filePath: string) {
    return fromFile(filePath).then((result) => result);
  }

  /**
   * validate match against rule
   */
  private matchAgainst(value: string, options: Options<F>, prefix: string) {
    const shouldMatch = options.shouldMatch;
    if (isObject(shouldMatch) && shouldMatch.target.toString() !== value) {
      this.setError(
        pickValue(shouldMatch, 'err', prefix + ' did not match'),
        value
      );
    }
  }

  /**
   * runs post validation
   */
  private postValidate(
    value: string,
    options: Options<F>,
    prefix: string = '{name}'
  ) {
    if (this.succeeds()) {
      this.matchAgainst(value, options, prefix);
    }
    return this.succeeds();
  }

  /**
   * resolves regex, returning a regex object
   * @param regex
   */
  private resolveRegex(regex: Regex): RegexObject {
    if (isRegex(regex)) {
      return {
        pattern: regex,
      };
    } else {
      return regex;
    }
  }

  /**
   * validates regex check none rules
   */
  protected regexCheckNone(value: string, options: TextOptions<F>) {
    if (this.succeeds() && options.regexNone) {
      const regexes = makeArray(options.regexNone);
      for (const current of regexes) {
        const regex = this.resolveRegex(current);
        if (regex.pattern.test(value)) {
          this.setError(
            pickValue(regex, 'err', '{value} is not a valid {name}'),
            value
          );
          break;
        }
      }
    }
    return this.succeeds();
  }

  /**
   * validates regex check any rules
   */
  protected regexCheckAny(value: string, options: TextOptions<F>) {
    if (this.succeeds() && options.regexAny) {
      if (!options.regexAny.patterns.some((pattern) => pattern.test(value))) {
        this.setError(
          pickValue(options.regexAny, 'err', '{value} is not a valid {name}'),
          value
        );
      }
    }
    return this.succeeds();
  }

  /**
   * check if value matches a pattern
   */
  protected regexCheck(value: string, options: TextOptions<F>) {
    if (this.succeeds() && options.regex) {
      const regexes = makeArray(options.regex);
      for (const current of regexes) {
        const regex = this.resolveRegex(current);
        if (!regex.pattern.test(value)) {
          this.setError(
            pickValue(regex, 'err', '{value} is not a valid {name}'),
            value
          );
          break;
        }
      }
    }
    return this.succeeds();
  }

  /**
   * runs regex rule checks
   */
  protected checkRegexRules(value: string, options: Options<F>) {
    //check for regex rule
    this.regexCheck(value, options);

    //check for regexAny rule
    this.regexCheckAny(value, options);

    //check for regexNone rule
    this.regexCheckNone(value, options);

    return this.succeeds();
  }

  /**
   * constructs error message for limiting rule errors
   */
  protected constructLRErrorMessage(
    prefix: string,
    template: string,
    value: number | CustomDate,
    unit: Unit
  ) {
    let formatter = new Intl.NumberFormat();
    let constructedMessage = '';

    prefix += ' ';

    switch (unit) {
      case 'character':
        constructedMessage =
          prefix +
          template +
          ' ' +
          formatter.format(value as number) +
          ' characters';
        break;

      case 'number':
        constructedMessage =
          prefix + template + ' ' + formatter.format(value as number);
        break;

      case 'date':
        constructedMessage = prefix + template + ' ' + value;
        break;
      case 'file':
        constructedMessage =
          prefix + template + ' ' + convertToMemoryUnit(value as number);
        break;
    }

    return constructedMessage;
  }

  /**
   * checks the limiting rules such as min, max, lt, gt
   */
  protected checkLimitingRules(
    value: string,
    length: number | CustomDate,
    options: NumberOptions<F>,
    unit: Unit,
    dateConverter?: DateConverter,
    prefix: string = '{name}'
  ) {
    const resolveValue = (value: string | number) => {
      if (dateConverter) {
        return dateConverter(value.toString());
      } else {
        return expandToNumeric(value);
      }
    };

    let errorMessage = '';
    let template = '';

    //check the min limit
    if (!isUndefined(options.min)) {
      const min = resolveValue(options.min);
      template = 'should not be less than';
      if (length < min) {
        errorMessage = this.constructLRErrorMessage(
          prefix,
          template,
          min,
          unit
        );
        return this.setError(pickValue(options, 'minErr', errorMessage), value);
      }
    }

    //check the max limit
    if (!isUndefined(options.max)) {
      const max = resolveValue(options.max);
      template = 'should not be greater than';
      if (length > max) {
        errorMessage = this.constructLRErrorMessage(
          prefix,
          template,
          max,
          unit
        );
        return this.setError(pickValue(options, 'maxErr', errorMessage), value);
      }
    }

    //check the gt limit
    if (!isUndefined(options.gt)) {
      const gt = resolveValue(options.gt);
      template = 'should be greater than';
      if (length <= gt) {
        errorMessage = this.constructLRErrorMessage(prefix, template, gt, unit);
        return this.setError(pickValue(options, 'gtErr', errorMessage), value);
      }
    }

    //check the lt limit
    if (!isUndefined(options.lt)) {
      const lt = resolveValue(options.lt);
      template = 'should be less than';
      if (length >= lt) {
        errorMessage = this.constructLRErrorMessage(prefix, template, lt, unit);
        return this.setError(pickValue(options, 'ltErr', errorMessage), value);
      }
    }

    return this.succeeds();
  }

  /**
   * validate text
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateText(
    field: string,
    value: string,
    index: number,
    options: TextOptions<F>
  ): boolean {
    this.reset(field, value, index);
    this.checkLimitingRules(value, value.length, options, 'character');

    //check for formatting rules
    this.checkRegexRules(value, options);

    return this.postValidate(value, options);
  }

  /**
   * validate object id string
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateObjectId(
    field: string,
    value: string,
    index: number,
    options: TextOptions<F>
  ): boolean {
    options.regex = {
      pattern: /^[0-9a-fA-F]{24}$/,
      err: options.err || '{value} is not a valid object id',
    };
    return this.validateText(field, value, index, options);
  }

  /**
   * validate email address
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateEmail(
    field: string,
    value: string,
    index: number,
    options: TextOptions<F>
  ): boolean {
    this.reset(field, value, index);
    /*
     * email validation https://www.w3resource.com/javascript/form/email-validation.php
     * https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
     */
    const err = '{value} is not a valid email address';
    const internalOptions: TextOptions<F> = {
      regex: [
        //email must contain two parts; personal-info and domain part
        {
          pattern: /^[-\w!#$%&'*+/=?^`{|}~.]{1,64}@[-a-z0-9.]{1,253}$/i,
          err,
        },
        //personal info must start with a word character
        {
          pattern: /^\w/,
          err,
        },
        // domain consists of labels that are each 63 characters max, each label
        // cannot start or end with highen
        {
          pattern: new RegExp(
            '@[a-z0-9](?:[-a-z0-9]*[a-z0-9])?' + //match first label
              '(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*' + //followed by one or more labels
              '(\\.[a-z]{2,4})$', //then must have a top level domain
            'i'
          ),
          err,
        },
      ],
      //in the personal info, there cant be two or more adjacent dots
      regexNone: {
        pattern: /\.{2,}.*@/,
        err,
      },
    };

    this.checkLimitingRules(value, value.length, options, 'character');

    this.checkRegexRules(value, internalOptions);
    this.checkRegexRules(value, options);

    return this.postValidate(value, options);
  }

  /**
   * validate url
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateURL(
    field: string,
    value: string,
    index: number,
    options: URLOptions<F>
  ): boolean {
    this.reset(field, value, index);
    /*
     * email validation https://www.w3resource.com/javascript/form/email-validation.php
     * https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
     */
    const schemes: string | string[] = pickValue(
      options,
      'schemes',
      URL_SCHEMES
    );
    const err = '{value} is not a valid url';
    const internalOptions: URLOptions<F> = {
      regex: {
        /*
         * domain consists of optional scheme, and consists of labels that are each
         * 63 characters max, each label cannot start or end with highen
         */
        pattern: new RegExp(
          //match optional scheme
          '^(?:(?:' +
            schemes.join('|') +
            ')://)' +
            (options.mustHaveScheme ? '' : '?') +
            '[a-z0-9](?:[-a-z0-9]*[a-z0-9])?' + //match first label
            '(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*' + // followed by one or more labels
            '(\\.[a-z]{2,4})' + //then must have a top level domain
            '(?:\\:\\d{1,4})?' + //match optional port number
            '(?:[#/?][-\\w()/#~:.?+=&%@]*)?$', //match optional part, hash, query
          'i'
        ),
        err,
      },
    };

    this.checkLimitingRules(value, value.length, options, 'character');

    this.checkRegexRules(value, internalOptions);
    this.checkRegexRules(value, options);

    return this.postValidate(value, options);
  }

  /**
   * validate phone number
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validatePhoneNumber(
    field: string,
    value: string,
    index: number,
    options: PhoneNumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    try {
      const country = options.country
        ? (options.country.substring(0, 2).toUpperCase() as CountryCode)
        : undefined;

      if (
        isValidPhoneNumber(value, country) &&
        (country === undefined ||
          parsePhoneNumber(value, country).country === country)
      ) {
        const parsedPhoneNumber = parsePhoneNumber(value, country);
        if (country && parsedPhoneNumber.country !== country) {
          this.setError(
            `{value} is not a valid phone number for ${parsedPhoneNumber.country}`,
            value
          );
        } else if (options.format) {
          this.transformedValue = parsePhoneNumber(value, country).format(
            options.format
          );
        }
      } else {
        this.setError(
          pickValue(options, 'err', '{value} is not a valid phone number'),
          value
        );
      }
    } catch (ex) {
      this.setError(this.phoneNumberErrors[ex.message], value);
    }

    this.checkLimitingRules(
      value,
      value.length,
      options,
      'character',
      undefined,
      'Phone number'
    );
    this.checkRegexRules(value, options);

    return this.postValidate(value, options);
  }

  /**
   * validate password
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validatePassword(
    field: string,
    value: string,
    index: number,
    options: PasswordOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (pickValue(options, 'preValidate', true)) {
      const internalOptions: PasswordOptions<F> = {
        min: MIN_PASSWORD_LENGTH,
        max: MAX_PASSWORD_LENGTH,

        regex: [
          //password should contain at least two alphabets
          {
            pattern: /[a-z].*[a-z]/i,
            err: 'Password must contain at least two letter alphabets',
          },
          //password should contain at least two non letter alphabets
          {
            pattern: /[^a-z].*[^a-z]/i,
            err: 'Password must contain at least two non letter alphabets',
          },
        ],
      };

      this.checkLimitingRules(
        value,
        value.length,
        internalOptions,
        'character',
        undefined,
        'Password'
      );
      this.checkRegexRules(value, internalOptions);
    }

    this.checkLimitingRules(
      value,
      value.length,
      options,
      'character',
      undefined,
      'Password'
    );
    this.checkRegexRules(value, options);

    return this.postValidate(value, options, 'Passwords');
  }

  /**
   * validates date
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateDate(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (!DATE_FORMAT.test(value)) {
      return this.setError('{value} is not a correct date format', value);
    }

    //if date is not valid, return immediately
    const date = CustomDate.isValid(value);
    if (date === false) {
      return this.setError('{value} is not a valid date', value);
    }

    //validate the limiting rules
    this.checkLimitingRules(value, date, options, 'date', dateConverter);

    return this.postValidate(value, options);
  }

  /**
   * validates integer
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateInt(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^[-+]?\d+$/.test(value)) {
      this.checkLimitingRules(value, parseInt(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid integer'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates positive integer
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validatePInt(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^[+]?\d+$/.test(value)) {
      this.checkLimitingRules(value, parseInt(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid positive integer'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates negative integer
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateNInt(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^-\d+$/.test(value)) {
      this.checkLimitingRules(value, parseInt(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid negative integer'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates floating point numbers
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateNumber(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^(?:[-+]?\d+(\.\d+)?|\.\d+)$/.test(value)) {
      this.checkLimitingRules(value, parseFloat(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid number'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates positive floating point numbers
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validatePNumber(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^(?:[+]?\d+(\.\d+)?|\.\d+)$/.test(value)) {
      this.checkLimitingRules(value, parseFloat(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid positive number'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates negative floating point numbers
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateNNumber(
    field: string,
    value: string,
    index: number,
    options: NumberOptions<F>
  ): boolean {
    this.reset(field, value, index);
    if (/^(?:[-]\d+(\.\d+)?|\.\d+)$/.test(value)) {
      this.checkLimitingRules(value, parseFloat(value), options, 'number');
    } else {
      this.setError(
        pickValue(options, 'err', '{value} is not a valid negative number'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates choice
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateChoice(
    field: string,
    value: string,
    index: number,
    options: ChoiceOptions<F>
  ): boolean {
    this.reset(field, value, index);
    const choices = options.choices as Array<string | number | boolean>;
    const exists = choices.some((current) => current.toString() === value);

    if (!exists) {
      this.setError(
        pickValue(options, 'err', '{value} is not an acceptable choice'),
        value
      );
    }

    return this.postValidate(value, options);
  }

  /**
   * validates range
   *
   * @param field field name under validation
   * @param value field value under validation
   * @param options validation options
   * @param index field value index position
   */
  validateRange(
    field: string,
    value: string,
    index: number,
    options: RangeOptions<F>
  ): boolean {
    let choices: string[] | number[] = [];
    if (isString(options.from)) {
      choices = range(options.from, options.to as string, options.step);
    } else {
      choices = range(options.from, options.to as number, options.step);
    }

    const choiceOptions: ChoiceOptions<F> = { choices };

    choiceOptions.shouldMatch = options.shouldMatch;
    choiceOptions.err = options.err;

    return this.validateChoice(field, value, index, choiceOptions);
  }

  /**
   * validates files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  async validateFile(
    field: string,
    file: FileEntry,
    index: number,
    options: FileOptions<F>,
    category?: string | string[],
    label?: string
  ): Promise<boolean> {
    this.reset(field, file, index);

    const value = file.name;

    //check limiting rules
    if (!this.checkLimitingRules(file.name, file.size, options, 'file')) {
      return false;
    }

    //check extensions and file category
    const exts = makeArray(options.exts as string).map((ext) =>
      ext.replace(/^\./, '').toLowerCase()
    );
    category = makeArray(category as string);

    const fileType = await this.getFileType(file.path);

    /* istanbul ignore if */
    if (isNull(fileType)) {
      return this.setError(
        '{value} file extension could not be detected. Please check file',
        file.name
      );
    }
    if (
      category.length > 0 &&
      !category.includes(fileType.mime.split('/')[0])
    ) {
      return this.setError(
        pickValue(options, 'err', `{value} is not ${label} file`),
        file.name
      );
    }
    if (exts.length > 0 && !exts.includes(fileType.ext)) {
      return this.setError(
        pickValue(options, 'extErr', `.${fileType.ext} files are not allowed`),
        file.name
      );
    }

    file.type = fileType.mime;
    file.key =
      path.basename(file.path, path.extname(file.path)) + '.' + fileType.ext;

    //move file to some location if given
    let result: SuccessOrErrorMessage = '';
    if (isCallable(options.moveTo)) {
      result = await options.moveTo(file);
      if (result !== true) {
        this.setError(result, file.name);
      }
    } else if (isString(options.moveTo)) {
      const dest = path.join(options.moveTo, file.key);
      try {
        fs.renameSync(file.path, dest);

        file.path = dest;
        file.type = fileType.mime;
      } catch (ex) {
        throw new FileException(ex.message);
      }
    }

    return this.postValidate(value, options);
  }

  /**
   * validates image files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateImage(
    field: string,
    file: FileEntry,
    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    return this.validateFile(field, file, index, options, 'image', 'an image');
  }

  /**
   * validates audio files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateAudio(
    field: string,
    file: FileEntry,

    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    return this.validateFile(
      field,
      file,

      index,
      options,
      'audio',
      'an audio'
    );
  }

  /**
   * validates video files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateVideo(
    field: string,
    file: FileEntry,

    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    return this.validateFile(
      field,
      file,

      index,
      options,
      'video',
      'a video'
    );
  }

  /**
   * validates media files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateMedia(
    field: string,
    file: FileEntry,

    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    return this.validateFile(
      field,
      file,

      index,
      options,
      ['image', 'video', 'video'],
      'a media'
    );
  }

  /**
   * validates document files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateDocument(
    field: string,
    file: FileEntry,

    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    options.exts = pickValue(options, 'exts', DEFAULT_DOCUMENT_FILES);
    return this.validateFile(field, file, index, options);
  }

  /**
   * validates document files
   *
   * @param field field name under validation
   * @param file file under validation
   * @param options validation options
   * @param index field value index position
   */
  validateArchive(
    field: string,
    file: FileEntry,
    index: number,
    options: FileOptions<F>
  ): Promise<boolean> {
    options.exts = pickValue(options, 'exts', DEFAULT_ARCHIVE_FILES);
    return this.validateFile(field, file, index, options);
  }
}
