import {
  DataSource,
  FilesSource,
  Rules,
  ResolvedRules,
  ResolvedRule,
  Rule,
  DataType,
  Filters,
  RawData,
  DataValue,
  Options,
  ErrorBag,
  RequiredIf,
  Data
} from './@types';
import { DB_MODELS } from './Constants';
import StateException from './Exceptions/StateException';
import DataSourceNotSetException from './Exceptions/DataSourceNotSetException';
import RulesNotSetException from './Exceptions/RulesNotSetException';
import {
  isString,
  pickValue,
  copy,
  makeArray,
  isUndefined,
  pickObject,
  CASE_STYLES,
  isArray,
  keyNotSetOrTrue,
  isNumeric,
  isObject,
  isNull,
  isTypeOf,
  isCallable,
  uniqueArray
} from '@forensic-js/utils';
import FilesSourceNotSetException from './Exceptions/FilesSourceNotSetException';
import { replaceCallback, replace } from '@forensic-js/regex';
import Validator from './Validator';
import CustomDate from './CustomDate';
import DataProxy from './DataProxy';
import DBChecker from './DBChecker';
import Model from './Model';

import {
  parsePhoneNumberFromString,
  PhoneNumber,
  CountryCode
} from 'libphonenumber-js';
import { PhoneNumberOptions } from './@types/rules/TextRules';
import {
  Files,
  FileEntry,
  FileEntryCollection
} from 'r-server/lib/typings/@types';
import {
  titleize,
  pluralize,
  singularize,
  ordinalize,
  capitalize
} from 'inflection';
import { DBCheckType, DBCheck, ModelDBCheck } from './@types/rules/BaseRule';

const globalConfig = {
  dbModel: DB_MODELS.NOSQL,
  dbCaseStyle: CASE_STYLES.CAMEL_CASE
};

export default class Handler<F extends string = string> {
  /**
   * supported database models
   */
  static DB_MODELS = DB_MODELS;

  /**
   * supported database field case styles
   */
  static DB_MODEL_CASE_STYLES = CASE_STYLES;

  /**
   * globally sets the database model to use
   * @param dbModel
   */
  static setDBModel(dbModel: number) {
    globalConfig.dbModel = dbModel;
  }

  /**
   * globally sets the database model field case style to use
   * @param dbCaseStyle
   */
  static setDBCaseStyle(dbCaseStyle: number) {
    globalConfig.dbCaseStyle = dbCaseStyle;
  }

  private dataSource: DataSource | null = null;

  private filesSource: Files | null = null;

  private addedFields: DataSource = {};

  private rules: Rules<F> | null = null;

  private resolvedRules: ResolvedRules<F> = {} as ResolvedRules<F>;

  private executed: boolean = false;

  private requiredFields: string[] = [];

  private optionalFields: string[] = [];

  private validator: Validator<F>;

  private dbChecker: DBChecker<F>;

  // database model in use
  private dbModel: number = globalConfig.dbModel;

  private dbCaseStyle: number = globalConfig.dbCaseStyle;

  private dataTypeToMethod: { [P in DataType]: string } = {
    text: 'validateText',

    title: 'validateText',

    name: 'validateText',

    objectId: 'validateObjectId',

    date: 'validateDate',

    //integer validation methods
    int: 'validateInt',
    pInt: 'validatePInt',
    nInt: 'validateNInt',

    //number validation methods
    number: 'validateNumber',
    pNumber: 'validatePNumber',
    nNumber: 'validateNNumber',
    money: 'validateNumber',

    //boolean validation
    boolean: '',
    checkbox: '',

    email: 'validateEmail',
    url: 'validateURL',
    choice: 'validateChoice',
    range: 'validateRange',

    //file related validations
    file: 'validateFile',
    image: 'validateImage',
    audio: 'validateAudio',
    video: 'validateVideo',
    media: 'validateMedia',
    document: 'validateDocument',
    archive: 'validateArchive',

    //password validation
    password: 'validatePassword',

    //phone number validation
    phoneNumber: 'validatePhoneNumber'
  };

  private DBCheckTypesToMethod: { [P in DBCheckType]: string } = {
    //check if exist method map
    exists: 'checkIfExists',

    //check if not exists method map
    notExists: 'checkIfNotExists'
  };

  private customData: { [p: string]: any } = {};

  public data: Data<F> = new Proxy<Data<F>>({} as Data<F>, DataProxy);

  public errors: ErrorBag<F> = {} as ErrorBag<F>;

  constructor(
    dataSource?: DataSource,
    filesSource?: FilesSource,
    rules?: Rules<F>,
    validator?: Validator<F>,
    dbChecker?: DBChecker<F>
  ) {
    this.setDataSource(dataSource)
      .setFilesSource(filesSource)
      .setRules(rules)
      .setValidator(validator || new Validator())
      .setDBChecker(dbChecker || new DBChecker());
  }

  /**
   * returns true if value is falsy
   */
  private valueIsFalsy(value: string): boolean {
    return (
      value === '' || /(false|off|0|nil|null|none|undefined|no)/i.test(value)
    );
  }

  /**
   * returns true if the given data type is a file data type
   */
  private isFileDataType(dataType: DataType): boolean {
    return [
      'file',
      'image',
      'audio',
      'video',
      'media',
      'document',
      'archive'
    ].includes(dataType);
  }

  /**
   * returns true if the given field's type is a file data type
   */
  private isFileField(field: string): boolean {
    return this.isFileDataType(this.resolvedRules[field].type);
  }

  /**
   * return empty file collection
   */
  private createEmptyFileEntryCollection(): FileEntryCollection {
    return {
      name: [],
      key: [],
      path: [],
      size: [],
      type: []
    };
  }

  /**
   * picks out a fileEntry out of the collection
   * @param fileCollection
   */
  private makeFileEntry(
    fileCollection: FileEntryCollection,
    index: number
  ): FileEntry {
    return Object.keys(fileCollection).reduce(
      (result, key) => {
        result[key] = fileCollection[key][index];
        return result;
      },
      {} as FileEntry
    );
  }

  /**
   * turns the file into a file collection
   * @param file
   */
  private makeFileCollection(
    file: RawData | FileEntry | FileEntryCollection | undefined
  ): FileEntryCollection {
    if (isObject<FileEntry | FileEntryCollection>(file)) {
      return Object.keys(file).reduce(
        (result, key) => {
          result[key] = makeArray(file[key]);
          return result;
        },
        {} as FileEntryCollection
      );
    } else {
      return this.createEmptyFileEntryCollection();
    }
  }

  /**
   * run post processes
   */
  private async runPostProcesses() {
    for (const field of Object.keys(this.resolvedRules)) {
      const rule = this.resolvedRules[field] as ResolvedRule<F>;
      if (isCallable(rule.postCompute)) {
        this.data[field] = await rule.postCompute(
          this.data[field],
          this.data,
          this
        );
      }
      if (isCallable(rule.postValidate)) {
        const result = await rule.postValidate(
          this.data[field],
          this.data,
          this
        );
        if (result !== true) {
          this.setError(field, result);
        }
      }
    }
  }

  /**
   * runs db check
   */
  private async runDBCheck(
    type: DataType,
    required: boolean,
    field: string,
    value: DataValue,
    checks: DBCheck<F>[],
    index: number
  ) {
    for (const check of checks) {
      if (isCallable(check)) {
        const result = await check(value, index, this.data, this);
        if (result !== true) {
          return this.setError(
            field,
            typeof result === 'string'
              ? result
              : pickValue('err', check, 'condition not satisfied')
          );
        }
      } else {
        const method = this.DBCheckTypesToMethod[check.if];
        await this.dbChecker[method](
          type,
          required,
          field,
          value,
          check,
          index
        );
        if (this.dbChecker.fails()) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * performs database integrity checks
   *
   * @param fields array of fields
   * @param required boolean indicating if fields are required
   */
  private async validateDBChecks(fields: string[], required: boolean) {
    for (const field of fields) {
      const { checks, type } = this.resolvedRules[field] as ResolvedRule<F>;
      if (checks.length > 0) {
        const values = makeArray<DataValue>(this.data[field]);

        const len = values.length;
        let i = -1;
        while (++i < len) {
          const value = values[i];
          await this.runDBCheck(
            type,
            required,
            field,
            value === null ? '' : value.toString(),
            checks,
            i
          );
        }
      }
    }
  }

  /**
   * carries out data validation
   */
  private async runValidation(
    required: boolean,
    field: string,
    type: DataType,
    value: string | FileEntry,
    options: Options<F>,
    index: number
  ) {
    const validator = this.validator;
    const method = this.dataTypeToMethod[type];
    if (method !== '') {
      await validator[method](required, field, value, options, index);
      if (isObject<FileEntry>(value)) {
        let data = this.data[field] as FileEntry | FileEntryCollection;
        const name = data.name;
        if (typeof name === 'string') {
          data = value;
          this.data[field] = value;
        } else {
          Object.keys(value).forEach(key => {
            (data as FileEntryCollection)[key][index] = value[key];
          });
        }
        this.data[field] = data;

        return validator.succeeds();
      }
    }
  }

  /**
   * performs data validation
   *
   * @param fields array of fields
   * @param required boolean indicating if fields are required
   */
  private async validateFields(fields: string[], required: boolean) {
    for (const field of fields) {
      const { options, type } = this.resolvedRules[field];
      const isFileDataType = this.isFileDataType(type);

      if (this.data[field] !== null && isFileDataType) {
        const fileCollection = this.makeFileCollection(this.data[field]);
        const len = fileCollection.name.length;
        let i = -1;

        while (++i < len) {
          const value = this.makeFileEntry(fileCollection, i);
          if (
            !(await this.runValidation(
              required,
              field,
              type,
              value,
              options,
              i
            ))
          ) {
            break;
          }
        }
      } else {
        const values = makeArray<DataValue>(this.data[field], true);
        const len = values.length;
        let i = -1;

        while (++i < len) {
          const value = values[i];
          if (
            !(await this.runValidation(
              required,
              field,
              type,
              value === null ? '' : value.toString(),
              options,
              i
            ))
          ) {
            break;
          }
        }
      }
    }
  }

  /**
   * flag error if certain data values are multiple when the field does not accept multiple values
   */
  private checkArrays() {
    const rules = this.resolvedRules;
    for (const field of Object.keys(this.resolvedRules)) {
      const rules = this.resolvedRules[field] as ResolvedRule<F>;
      const data = this.data[field];

      const isFileField = this.isFileField(field);
      if (!rules.array) {
        if (
          (isFileField &&
            isObject<FileEntry | FileEntryCollection>(data) &&
            isArray(data.key)) ||
          (!isFileField && isArray(data))
        ) {
          this.setError(field, '{_this} does not accept multiple values');
        }
      }
    }
    return this.succeeds();
  }

  /**
   * retrieves fields' data
   */
  private getFields(fields: string[]) {
    fields.forEach(field => {
      const rules = this.resolvedRules[field] as ResolvedRule<F>;
      const isFileField = this.isFileField(field);
      const fieldIsMissing = this.fieldIsMissing(field);

      const filesSource = this.filesSource as FilesSource;
      const dataSource = this.dataSource as DataSource;

      let value:
        | RawData
        | FileEntryCollection
        | FileEntry
        | undefined = isFileField ? filesSource[field] : dataSource[field];

      if (fieldIsMissing) {
        value = rules.defaultValue;
      }

      if (rules.array) {
        value = isFileField
          ? this.makeFileCollection(value)
          : (makeArray(value as string).filter(
              value => value !== ''
            ) as RawData);
      }
      this.data[field] = this.filterValue(value, field);
    });
  }

  /**
   * returns true if field is missing
   */
  private fieldIsMissing(field: string) {
    const isFileField = this.isFileField(field);
    const filesSource = this.filesSource as FilesSource;
    const dataSource = this.dataSource as DataSource;

    if (isFileField) {
      return isUndefined(filesSource[field]);
    } else if (isUndefined(dataSource[field])) {
      return true;
    }

    let value = (this.dataSource as DataSource)[field];
    if (isString(value)) {
      return value === '';
    } else {
      dataSource[field] = value = value.filter(current => current !== '');
      return value.length === 0;
    }
  }

  /**
   * checks for missing required fields
   */
  private checkMissingFields(): boolean {
    this.requiredFields.forEach(field => {
      if (this.fieldIsMissing(field)) {
        this.setError(field, this.resolvedRules[field].hint);
      }
    });
    return this.succeeds();
  }

  /**
   * strips html tags from the given value
   */
  private stripTags(value: string, stripTagsIgnore: string | string[]) {
    if (isString(stripTagsIgnore)) {
      stripTagsIgnore = stripTagsIgnore.split(/[,\s>]/);
    }
    stripTagsIgnore = stripTagsIgnore
      .map(tag => tag.toLowerCase().replace(/[/<>]/g, ''))
      .filter(tag => tag !== '');

    const matchName = '[_a-z][-\\w]*';
    const regex = new RegExp(
      //capture tagName
      '<\\s*\\/?(' +
        matchName +
        ')' +
        //followed by zero or more attributes, with the attribute value optional
        '(?:\\s+' +
        matchName +
        '(?:=(?:"[^"]*"|\'[^\']*\'))?)*' +
        //then ends with zero or more spaces followed by the right angle bracket
        '\\s*>',
      'i'
    );

    return replaceCallback(
      regex,
      matches => {
        if (stripTagsIgnore.includes(matches[1].toLowerCase())) {
          return matches[0];
        } else {
          return '';
        }
      },
      value
    );
  }

  /**
   * runs defined filters on the given value and returns the result
   */
  private filterValue(
    value: RawData | FileEntry | FileEntryCollection,
    field: string
  ): DataValue {
    const resolvedRules = this.resolvedRules;
    const type = resolvedRules[field].type as DataType;
    const filters = resolvedRules[field].filters as Filters;

    /**
     * performs the filter
     * @param value the current value
     */
    const performFilter = (value: string) => {
      let result: string | number | boolean = value;

      if (type === 'checkbox' || type === 'boolean') {
        return !this.valueIsFalsy(value);
      }

      //decode value
      if (keyNotSetOrTrue('decode', filters)) {
        result = decodeURIComponent(result);
      }

      //strip tags before doing any trim operations
      if (keyNotSetOrTrue('stripTags', filters)) {
        result = this.stripTags(
          result,
          pickValue('stripTagsIgnore', filters, [])
        );
      }

      //minimize data by triming and removing empty lines, suitable when handling
      //computer proprams such as html, xml, json, etc
      if (filters.minimize) {
        result = result
          .split(/\r\n|\r|\n/)
          .map(value => value.trim())
          .filter(value => !/^\s*$/.test(value))
          .join(' ');
      }

      // trim value
      if (keyNotSetOrTrue('trim', filters)) {
        result = result.trim();
      }

      // title
      if (filters.titleize || type == 'title' || type === 'name') {
        result = titleize(result);
      }
      //capitalize
      else if (filters.capitalize) {
        result = capitalize(result);
      }
      // upper case
      else if (filters.uppercase) {
        result = (result as string).toUpperCase();
      }
      //lower case
      else if (filters.lowercase) {
        result = (result as string).toLowerCase();
      }

      if (filters.pluralize) {
        result = pluralize(result);
      }

      if (filters.singularize) {
        result = singularize(result);
      }

      if (filters.ordinalize) {
        result = ordinalize(result);
      }

      //cast to float
      if (filters.toNumeric) {
        result = isNumeric(result) ? parseFloat(result) : 0;
      }

      switch (type) {
        case 'email':
          result = replace(/[^-\w!#$%&'*+/=?^`{|}~.@]/, '', result as string);
          break;

        case 'url':
          result = replace(
            /[^-\w!#$%&'*+/=?^`:?{|}()~.@]/,
            '',
            result as string
          );
          break;

        case 'int':
        case 'nInt':
        case 'pInt':
          if (isNumeric(result)) {
            result = parseInt((result as any) as string);
          }
          break;

        case 'number':
        case 'nNumber':
        case 'pNumber':
        case 'money':
          if (isNumeric(result)) {
            result = parseFloat((result as any) as string);
          }
          break;
      }

      //run callback on the value if given
      if (filters.callback) {
        result = filters.callback(result.toString());
      }

      return result;
    };

    if (value === '') {
      return null;
    }

    if (isObject<FileEntry | FileEntryCollection>(value)) {
      const name = value.name;
      value.name = (isArray(name)
        ? name.map(current => performFilter(current))
        : performFilter(name)) as string;
      return value;
    } else {
      if (isArray(value)) {
        return uniqueArray(value as string[]).map(current =>
          performFilter(current.toString())
        ) as DataValue;
      } else {
        return performFilter(value.toString());
      }
    }
  }

  /**
   * resolves an option
   */
  private resolveOption(field: string, options: any) {
    const data = this.data;
    const resolve = (field: string, value: string) => {
      return replaceCallback(
        /\{\s*([^}]+)\s*\}/,
        matches => {
          const capture = matches[1];
          let result: string | number = pickValue(capture, data, matches[0]);

          //while resolving, leave out this and _index, as they are runtime values
          switch (capture.toLowerCase()) {
            case '_this':
              result = field;
              break;

            case 'current_date':
              result = '' + new CustomDate();
              break;

            case 'current_year':
              result = new CustomDate().getFullYear();
              break;

            case 'current_time':
              result = new CustomDate().getTime() * 1000;
              break;
          }
          return result.toString();
        },
        value
      );
    };

    if (isObject(options)) {
      for (const [key, value] of Object.entries(options)) {
        options[key] = this.resolveOption(field, value);
      }
      return options;
    }

    if (isArray(options)) {
      return options.map(value => {
        return this.resolveOption(field, value);
      });
    }

    if (isString(options)) {
      return resolve(field, options);
    }

    return options;
  }

  /**
   * resolves the specific target objects within all resolved rules
   */
  private resolveOptions(target: keyof ResolvedRule<F>) {
    Object.keys(this.resolvedRules).forEach(field => {
      const rule = this.resolvedRules[field];
      rule[target] = this.resolveOption(field, rule[target]);
    });
  }

  /**
   * extracts required fields and optional fields.
   * @param rules
   */
  private categorizeRules() {
    Object.keys(this.resolvedRules).forEach(field => {
      const rule = this.resolvedRules[field];
      if (rule.required) {
        this.requiredFields.push(field);
      } else {
        this.optionalFields.push(field);
      }
    });
  }

  /**
   * filter rules to be validated.
   * @param requiredFields
   */
  private filterRules(requiredFields: string | string[]) {
    requiredFields = makeArray(requiredFields);
    this.resolvedRules = Object.keys(this.resolvedRules).reduce(
      (result, field) => {
        const rule = this.resolvedRules[field];
        const isFileField = this.isFileField(field);

        if (requiredFields.includes(field)) {
          result[field] = rule;
        } else if (
          isFileField &&
          !isUndefined((this.filesSource as FilesSource)[field])
        ) {
          result[field] = rule;
        } else if (
          !isFileField &&
          !isUndefined((this.dataSource as DataSource)[field])
        ) {
          result[field] = rule;
        }
        return result;
      },
      {} as ResolvedRules<F>
    );
  }

  /**
   * performs the conditional if resolution
   * @param conditionalIf
   */
  private resolveConditionalIf(conditionalIf: RequiredIf<F>): boolean {
    const targetField = conditionalIf.field;
    let status = false;

    const filteredValue = this.filterValue(
      pickValue(targetField, this.dataSource as DataSource, ''),
      targetField
    );
    switch (conditionalIf.if) {
      case 'checked':
        status = !!filteredValue;
        break;

      case 'notChecked':
        status = !filteredValue;
        break;

      case 'equals':
        status = filteredValue === conditionalIf.value;
        break;

      case 'notEquals':
        status = filteredValue !== conditionalIf.value;
        break;

      case 'in':
        status = makeArray<DataValue>(filteredValue).includes(
          conditionalIf.value
        );
        break;

      case 'notIn':
        status = !makeArray<DataValue>(filteredValue).includes(
          conditionalIf.value
        );
        break;

      case 'valueIn':
        status = conditionalIf.values.includes(filteredValue as string);
        break;

      case 'valueNotIn':
        status = !conditionalIf.values.includes(filteredValue as string);
        break;
    }
    return status;
  }

  /**
   * resolves all requiredIf conditional rule
   */
  private resolveRequiredIf() {
    for (const [field, rule] of Object.entries<ResolvedRule<F>>(
      this.resolvedRules
    )) {
      const requiredIf = rule.requiredIf;
      if (isObject<RequiredIf<F>>(requiredIf)) {
        rule.required = false;
        if (this.resolveConditionalIf(requiredIf)) {
          rule.required = true;
        } else if (requiredIf.drop !== false) {
          if (this.isFileField(field)) {
            delete (this.filesSource as FilesSource)[field];
          } else {
            (this.dataSource as DataSource)[field] = '';
          }
        }
      }
    }
  }

  /**
   * resolves the rule and returns the result
   */
  private resolveRule(field, rule: Rule<F> | DataType): ResolvedRule<F> {
    if (isString(rule)) {
      rule = { type: rule } as Rule<F>;
    }

    const type = pickValue('type', rule, 'text') as DataType;
    const result: ResolvedRule<F> = {
      type,
      required: pickValue('required', rule, true),
      array: pickValue(
        'array',
        rule,
        pluralize(field) === field && type !== 'boolean' && type !== 'checkbox'
      ),
      defaultValue: pickValue('defaultValue', rule, ''),
      hint: pickValue('hint', rule, `${field} is required`),
      requiredIf: pickValue('requiredIf', rule, undefined),
      options: pickObject('options', rule),
      filters: pickObject('filters', rule),
      checks: makeArray(rule.checks as DBCheck<F>[]),
      postCompute: pickValue('postCompute', rule, undefined),
      postValidate: pickValue('postValidate', rule, undefined)
    };

    //enclose the target field
    if (!isUndefined(result.options.shouldMatch)) {
      if (isString(result.options.shouldMatch)) {
        result.options.shouldMatch = { target: result.options.shouldMatch };
      }
      result.options.shouldMatch.target = `{${result.options.shouldMatch.target}}` as F;
    }

    if (
      result.type === 'checkbox' ||
      typeof rule.defaultValue !== 'undefined'
    ) {
      result.required = false;
    }

    if (result.type === 'phoneNumber') {
      const postCompute = result.postCompute;
      const options = result.options as PhoneNumberOptions<F>;

      result.postCompute = (value: string, data) => {
        const newValue = (parsePhoneNumberFromString(
          value,
          options.country
            ? (options.country.substring(0, 2).toUpperCase() as CountryCode)
            : undefined
        ) as PhoneNumber).number;

        if (postCompute) {
          return postCompute(newValue as DataValue, data, this);
        } else {
          return newValue as DataValue;
        }
      };
    }
    return result;
  }

  /**
   * resolves the given rules
   */
  private resolveRules() {
    const rules = this.rules as Rules<F>;
    const fields = Object.keys(rules);

    this.resolvedRules = fields.reduce(
      (result, field) => {
        const rule = rules[field];
        result[field] = this.resolveRule(field, rule);

        return result;
      },
      {} as ResolvedRules<F>
    );

    //if there is a file field, and the user did not set the files object, throw
    if (
      isNull(this.filesSource) &&
      fields.some(field => this.isFileField(field))
    ) {
      throw new FilesSourceNotSetException();
    }
  }

  /**
   * checks if the handler should be executed
   */
  private shouldExecute() {
    if (this.executed) {
      throw new StateException('A handler can only be executed once');
    }

    if (this.dataSource === null) {
      throw new DataSourceNotSetException();
    }

    if (this.rules === null) {
      throw new RulesNotSetException();
    }
  }

  /**
   * sets the data source object if given
   */
  setDataSource(dataSource?: DataSource): this {
    const resolveData = (arg: Array<string> | string) => {
      if (isArray(arg)) {
        return arg.map(current => resolveData(current));
      } else {
        return arg.toString();
      }
    };

    if (dataSource) {
      this.dataSource = Object.keys(dataSource).reduce((result, key) => {
        result[key] = resolveData(dataSource[key]);
        return result;
      }, {});
    }
    return this;
  }

  /**
   * sets the files source object if given
   */
  setFilesSource(filesSource?: FilesSource): this {
    if (filesSource) {
      this.filesSource = filesSource;
    }
    return this;
  }

  /**
   * set rules
   */
  setRules(rules?: Rules<F>): this {
    if (rules) {
      this.rules = rules;
    }
    return this;
  }

  /**
   * sets the validator instance to use
   */
  setValidator(validator: Validator<F>): this {
    validator.setErrorBag(this.errors);
    this.validator = validator;
    return this;
  }

  /**
   * sets the db checker instance to use
   * @param dbChecker
   */
  setDBChecker(dbChecker: DBChecker<F>): this {
    dbChecker.setErrorBag(this.errors);
    this.dbChecker = dbChecker;
    return this;
  }

  /**
   * sets the instance database model to use
   * @param dbModel
   */
  setDBModel(dbModel: number) {
    this.dbModel = dbModel;
  }

  /**
   * sets the instance database model field case style to use
   * @param dbCaseStyle
   */
  setDBCaseStyle(dbCaseStyle: number) {
    this.dbCaseStyle = dbCaseStyle;
  }

  /**
   * sets the error message
   */
  setError(field: string, errorMessage: string | false): this {
    this.errors[field] = errorMessage ? errorMessage : 'error occured';
    return this;
  }

  /**
   *
   * @param field
   * @param value
   */
  addField(field: string, value: DataValue) {
    this.addedFields[field] = value as RawData;
    return this;
  }

  /**
   * add extra fields to the data to be validated
   * @param fields object of field value pairs
   */
  addFields(fields: { [field: string]: DataValue }) {
    Object.keys(fields).forEach(field => {
      this.addField(field, fields[field]);
    });
    return this;
  }

  /**
   * asynchronously executes the handler instance
   *
   * @param validateOnDemand boolean value indicating if it should only pick and validate
   * fields that were sent and whose rules are defined. perfect when performing data updates
   * @param requiredFields field or array of fields that must be included when validating on
   * demand, even if they were not sent.
   */
  async execute(
    validateOnDemand: boolean = false,
    requiredFields: string[] | string = []
  ): Promise<boolean> {
    this.shouldExecute();
    this.executed = true;

    // copy fields
    this.dataSource = copy({}, this.dataSource as DataSource, this.addedFields);
    this.filesSource = this.filesSource
      ? copy({}, this.filesSource)
      : this.filesSource;

    this.resolveRules();
    this.resolveRequiredIf();

    if (validateOnDemand) {
      this.filterRules(requiredFields);
    }
    this.categorizeRules();

    //resolve hints
    this.resolveOptions('hint');
    if (this.checkMissingFields()) {
      this.getFields(this.requiredFields);
      this.getFields(this.optionalFields);

      if (this.checkArrays()) {
        //resolve options.
        this.resolveOptions('options');
        this.resolveOptions('checks');

        await this.validateFields(this.requiredFields, true);
        await this.validateFields(this.optionalFields, false);

        if (this.succeeds()) {
          this.dbChecker
            .setDBModel(this.dbModel)
            .setDBCaseStyle(this.dbCaseStyle);
          await this.validateDBChecks(this.requiredFields, true);
          await this.validateDBChecks(this.optionalFields, false);
        }

        if (this.succeeds()) {
          await this.runPostProcesses();
        }
      }
    }

    return this.succeeds();
  }

  /**
   * returns true if the handler has been executed and no errors were found
   */
  succeeds(): boolean {
    return this.executed && Object.keys(this.errors).length === 0;
  }

  /**
   * return true if handler has not been executed or if it has been executed but there are
   * some errors found
   */
  fails(): boolean {
    return !this.succeeds();
  }

  /**
   * returns the resolved rule, only useful for testing
   */
  getResolvedRules() {
    return this.resolvedRules;
  }

  /**
   * gets the instance current database model in use
   */
  getDBModel() {
    return this.dbModel;
  }

  /**
   * gets the instance current database model field case style in use
   */
  getDBCaseStyle() {
    return this.dbCaseStyle;
  }

  /**
   * creates and returns a model instance, that can be exported
   */
  model(): Model<F> {
    return new Model<F>(this);
  }

  /**
   * sets custom data by the given name
   * @param name custom data name
   * @param value custom data value
   */
  setCustomData(name: string, value: any) {
    this.customData[name] = value;
    return this;
  }

  /**
   * gets an already set custom data
   * @param name custom data name
   */
  getCustomData<T = any>(name: string): T {
    return this.customData[name];
  }
}
