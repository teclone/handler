import {
  DataSource,
  FilesSource,
  Rules,
  ResolvedRules,
  ResolvedRule,
  Rule,
  DataType,
  RawData,
  DataValue,
  ErrorBag,
  RequiredIf,
  Data,
  Filters,
} from './@types';
import { StateException } from './Exceptions/StateException';
import { DataSourceNotSetException } from './Exceptions/DataSourceNotSetException';
import { RulesNotSetException } from './Exceptions/RulesNotSetException';
import {
  isString,
  pickValue,
  copy,
  makeArray,
  isUndefined,
  pickObject,
  CASE_STYLES,
  isArray,
  isNumeric,
  isObject,
  isCallable,
  uniqueArray,
} from '@teclone/utils';
import { FilesSourceNotSetException } from './Exceptions/FilesSourceNotSetException';
import { replaceCallback, replace } from '@teclone/regex';
import { Validator } from './Validator';
import { CustomDate } from './CustomDate';
import { DataProxy } from './DataProxy';
import { Model } from './Model';
import {
  Files,
  FileEntry,
  FileEntryCollection,
} from '@teclone/r-server/lib/@types/index';
import {
  titleize,
  pluralize,
  singularize,
  ordinalize,
  capitalize,
} from 'inflection';
import type { Adapter } from './DBAdapters/Adapter';
import { DB_TYPES } from './Constants';
import { MongooseAdapter } from './DBAdapters/MongooseAdapter';
import { SingleDataValue } from './@types/rules/BaseRule';
import { SequelizeAdapter } from './DBAdapters/SequelizeAdapter';

const globalConfig = {
  /**
   * default database type
   */
  dbType: DB_TYPES.RELATIONAL,

  /**
   * default global database case style
   */
  dbCaseStyle: CASE_STYLES.CAMEL_CASE,

  /**
   * default global database adapter;
   */
  dbAdapterClass: null,
};

export class Handler<F extends string = string> {
  /**
   * supported database field case styles
   */
  static DB_CASE_STYLES = CASE_STYLES;

  /**
   * supported database types
   */
  static DB_TYPES = DB_TYPES;

  /**
   * globally sets the database field case style to use
   * @param dbCaseStyle
   */
  static setDBCaseStyle(dbCaseStyle: number) {
    globalConfig.dbCaseStyle = dbCaseStyle;
  }

  /**
   * globally sets the database type
   */
  static setDBType(dbType: number) {
    globalConfig.dbType = dbType;
  }

  /**
   * globally sets the database adapter class to be used
   * @param adapterClass
   */
  static setDBAdapterClass<F extends string, C extends Adapter<F>>(
    adapterClass: C
  ) {
    globalConfig.dbAdapterClass = adapterClass as any;
  }

  private dataSource: DataSource | null = null;

  private filesSource: Files | null = null;

  private addedFields: DataSource = {};

  private rules: Rules<F> | null = null;

  private resolvedRules: ResolvedRules<F> = {} as ResolvedRules<F>;

  private executed: boolean = false;

  private validator: Validator<F>;

  private dbAdapter: Adapter<F>;

  private dbCaseStyle: number = globalConfig.dbCaseStyle;

  private dbType: number = globalConfig.dbType;

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
    phoneNumber: 'validatePhoneNumber',
  };

  private customData: { [p: string]: any } = {};

  public data: Data<F> = new Proxy<Data<F>>({} as Data<F>, DataProxy);

  public errors: ErrorBag<F> = {} as ErrorBag<F>;

  constructor(
    dataSource?: DataSource,
    filesSource?: FilesSource,
    rules?: Rules<F>,
    validator?: Validator<F>,
    dbAdapter?: Adapter<F>
  ) {
    this.setDataSource(dataSource)
      .setFilesSource(filesSource)
      .setRules(rules)
      .setValidator(validator || new Validator())
      .setDBAdapter(dbAdapter);
  }

  /**
   * returns array of resolved fields
   * @returns
   */
  private getResolvedFields() {
    return Object.keys(this.resolvedRules) as F[];
  }

  /**
   * returns true if value is falsy
   */
  private valueIsFalsy(value: string): boolean {
    return (
      value === '' || /^(false|off|0|nil|null|none|undefined|no)$/i.test(value)
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
      'archive',
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
      type: [],
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
    return Object.keys(fileCollection).reduce((result, key) => {
      result[key] = fileCollection[key][index];
      return result;
    }, {} as FileEntry);
  }

  /**
   * turns the file into a file collection
   * @param file
   */
  private makeFileCollection(
    file: RawData | FileEntry | FileEntryCollection | undefined
  ): FileEntryCollection {
    if (isObject<FileEntry | FileEntryCollection>(file)) {
      return Object.keys(file).reduce((result, key) => {
        result[key] = makeArray(file[key]);
        return result;
      }, {} as FileEntryCollection);
    } else {
      return null;
    }
  }

  /**
   * run post processes
   */
  private async runPostProcesses() {
    for (const field of this.getResolvedFields()) {
      const rule = this.resolvedRules[field];
      if (isCallable(rule.compute)) {
        this.data[field] = await rule.compute(field, this.data[field], this);
      }
    }
  }

  private async iterateFieldData(
    field: F,
    iterator: (
      field: F,
      value,
      index: number,
      handler: Handler<F>
    ) => Promise<boolean>
  ) {
    const { type } = this.resolvedRules[field];
    const isFileDataType = this.isFileDataType(type);

    let fileCollection: FileEntryCollection;
    let dataValues: Array<DataValue>;

    let len: number = 0;
    let i = -1;

    if (isFileDataType) {
      // file collection can be null or file collection object. it is null if the file was not sent
      fileCollection = this.makeFileCollection(this.data[field] as any);
      len = fileCollection ? fileCollection.name.length : 0;
    } else {
      dataValues = makeArray<DataValue>(this.data[field]);
      len = dataValues.length;
    }

    while (++i < len) {
      const value = isFileDataType
        ? this.makeFileEntry(fileCollection, i)
        : dataValues[i];

      if (!(await iterator(field, value, i, this))) {
        break;
      }
    }
  }

  /**
   * runs db check
   */
  private async runDBCheck(field: F, value: SingleDataValue, index: number) {
    const { type, checks } = this.resolvedRules[field];
    for (const check of checks) {
      if (isCallable(check)) {
        const result = await check(field, value, index, this);
        if (result !== true) {
          this.setError(
            field,
            typeof result === 'string' ? result : 'condition not satisfied'
          );
          break;
        }
      } else {
        await this.dbAdapter.execute(type, field, value, index, check, this);
        if (this.dbAdapter.fails()) {
          break;
        }
      }
    }
    return true;
  }

  /**
   * carries out data validation
   */
  private async runValidation(
    field: F,
    value: string | FileEntry,
    index: number
  ) {
    const { type, options, validate = () => true } = this.resolvedRules[field];
    const validator = this.validator;
    const method = this.dataTypeToMethod[type];

    if (method && typeof validator[method] !== 'undefined') {
      if (await validator[method](field, value, index, options)) {
        const result = await validate(field, value, index, this);
        if (result === true) {
          switch (type) {
            case 'phoneNumber':
              this.data[field] = validator.getTransformedValue();
              break;

            default:
              // if it is a file field that we validated, would need to update the file properties, such as the file location
              if (this.isFileField(field)) {
                const oldFileData = this.data[field] as
                  | FileEntry
                  | FileEntryCollection;
                let newFileData: FileEntry | FileEntryCollection;
                if (typeof oldFileData.name === 'string') {
                  newFileData = value as FileEntry;
                } else {
                  newFileData = oldFileData;
                  // update properties at the specific index
                  Object.keys(value).forEach((key) => {
                    newFileData[key][index] = value[key];
                  });
                }

                this.data[field] = newFileData;
              }
          }
        } else {
          this.setError(field, result);
        }
      }
    }
    return this.succeeds();
  }

  /**
   * performs database integrity checks
   */
  private async validateDBChecks() {
    // resolve dbAdapter
    if (!this.dbAdapter) {
      const AdapterClass =
        globalConfig.dbAdapterClass ||
        (this.dbType === DB_TYPES.NOSQL ? MongooseAdapter : SequelizeAdapter);
      this.setDBAdapter(new AdapterClass());
    }
    this.dbAdapter.setDBCaseStyle(this.dbCaseStyle);

    for (const field of this.getResolvedFields()) {
      const { checks } = this.resolvedRules[field];
      if (checks.length) {
        await this.iterateFieldData(field, (field, value, index) =>
          this.runDBCheck(field, value, index)
        );
      }
    }

    return this.succeeds();
  }

  /**
   * performs data validation
   *
   * @param fields array of fields
   * @param required boolean indicating if fields are required
   */
  private async validateFields() {
    this.validator.setErrorBag(this.errors);
    for (const field of this.getResolvedFields()) {
      await this.iterateFieldData(field, (field, value, index) => {
        return this.runValidation(
          field,
          isObject(value) ? value : value.toString(),
          index
        );
      });
    }
    return this.succeeds();
  }

  /**
   * flag error if certain data values are multiple when the field does not accept multiple values
   */
  private checkLists() {
    for (const field of Object.keys(this.resolvedRules)) {
      const rules = this.resolvedRules[field as F];
      const data = this.data[field];

      const isFileField = this.isFileField(field);

      if (
        !rules.isList &&
        ((!isFileField && isArray(data)) || (isFileField && isArray(data?.key)))
      ) {
        this.setError(field, '{name} does not accept multiple values');
      }
    }
    return this.succeeds();
  }

  /**
   * retrieves fields' data
   */
  private getFieldsData() {
    for (const field of this.getResolvedFields()) {
      const rule = this.resolvedRules[field];
      const isFileField = this.isFileField(field);

      let value: RawData | FileEntryCollection | FileEntry | undefined;

      if (this.fieldIsMissing(field)) {
        value = rule.defaultValue;
      } else {
        value = isFileField ? this.filesSource[field] : this.dataSource[field];
      }

      if (rule.isList) {
        value = isFileField
          ? this.makeFileCollection(
              value || this.createEmptyFileEntryCollection()
            )
          : (makeArray(value) as RawData);
      }

      this.data[field] = this.filterValue(rule.type, rule.filters, value);
    }
  }

  /**
   * returns true if field is missing
   */
  private fieldIsMissing(field: F) {
    const filesSource = this.filesSource as FilesSource;
    const dataSource = this.dataSource as DataSource;

    if (this.isFileField(field)) {
      return isUndefined(filesSource[field]);
    }

    if (isUndefined(dataSource[field])) {
      return true;
    }

    let value = this.dataSource[field];
    if (isString(value)) {
      return value === '';
    }

    dataSource[field] = value = value.filter((current) => current !== '');
    return value.length === 0;
  }

  /**
   * checks for missing required fields
   */
  private checkMissingFields(): boolean {
    for (const field of this.getResolvedFields()) {
      const { required, hint } = this.resolvedRules[field];
      if (required && this.fieldIsMissing(field)) {
        this.setError(field, hint);
      }
    }
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
      .map((tag) => tag.toLowerCase().replace(/[/<>]/g, ''))
      .filter((tag) => tag !== '');

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
      (matches) => {
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
    type: DataType,
    filters: Filters,
    value: RawData | FileEntry | FileEntryCollection
  ): DataValue {
    filters = filters || {};
    const {
      unique = true,
      decode = true,
      stripTags = true,
      stripTagsIgnore = [],
      minimize,
      trim = true,
    } = filters;

    /**
     * performs the filter
     * @param value the current value
     */
    const performFilter = (value: string | number | boolean) => {
      let result: string | number | boolean = value.toString();

      if (type === 'checkbox' || type === 'boolean') {
        return this.valueIsFalsy(result) ? false : true;
      }

      //decode value
      if (decode) {
        result = decodeURIComponent(result);
      }

      //strip tags before doing any trim operations
      if (stripTags) {
        result = this.stripTags(result, stripTagsIgnore);
      }

      //minimize data by triming and removing empty lines, suitable when handling
      //computer programs such as html, xml, json, etc
      if (minimize) {
        result = result
          .split(/\r\n|\r|\n/)
          .map((value) => value.trim())
          .filter(Boolean)
          .join(' ');
      }

      // trim value
      if (trim) {
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
            result = parseInt(result as any as string);
          }
          break;

        case 'number':
        case 'nNumber':
        case 'pNumber':
        case 'money':
          if (isNumeric(result)) {
            result = parseFloat(result as any as string);
          }
          break;
      }

      //run callback on the value if given
      if (filters.callback) {
        result = filters.callback(result.toString());
      }

      return result === '' ? null : result;
    };

    if (isObject<FileEntry | FileEntryCollection>(value)) {
      const name = value.name;
      value.name = (
        isArray(name)
          ? name.map((current) => performFilter(current))
          : performFilter(name)
      ) as string;

      return value;
    }

    if (isArray(value)) {
      const uniqueValues = unique ? uniqueArray(value) : value;
      return uniqueValues
        .map(performFilter)
        .filter((current) => current !== null) as DataValue;
    }

    return performFilter(value);
  }

  /**
   * resolves an option
   */
  private resolveOption(field: F, options: any) {
    const data = this.data;
    const resolve = (field: string, value: string) => {
      return replaceCallback(
        /\{\s*([^}]+)\s*\}/,
        (matches) => {
          const capture = matches[1];
          let result: string | number = pickValue(data, capture, matches[0]);

          //while resolving, leave out value and index, as they are runtime values
          switch (capture.toLowerCase()) {
            case 'name':
              result = field;
              break;

            case 'current_date':
              result = new CustomDate().currentDate();
              break;

            case 'current_year':
              result = new CustomDate().currentYear();
              break;

            case 'current_time':
              result = new CustomDate().currentTime();
              break;
          }

          return result.toString();
        },
        value
      );
    };

    if (isObject(options) && field !== 'model') {
      for (const [key, value] of Object.entries(options)) {
        options[key] = this.resolveOption(field, value);
      }
      return options;
    }

    if (isArray(options)) {
      return options.map((value) => {
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
    this.getResolvedFields().forEach((field) => {
      const rule = this.resolvedRules[field];
      rule[target as any] = this.resolveOption(field, rule[target]);
    });
  }

  /**
   * filter rules to be validated, used when validate on demand is set as true
   * @param requiredFields
   */
  private filterRules(requiredFields: F[]) {
    this.resolvedRules = this.getResolvedFields().reduce((result, field: F) => {
      const rule = this.resolvedRules[field];
      const isFileField = this.isFileField(field);

      if (requiredFields.includes(field)) {
        result[field] = rule;
      } else if (isFileField && !isUndefined(this.filesSource[field])) {
        result[field] = rule;
      } else if (!isFileField && !isUndefined(this.dataSource[field])) {
        result[field] = rule;
      }
      return result;
    }, {} as ResolvedRules<F>);
  }

  /**
   * resolves the rule, makes it an object and returns it
   * @param rule
   * @returns
   */
  private makeObjectRule(rule: DataType | Rule<F>): Rule<F> {
    if (isObject<Rule<F>>(rule)) {
      return {
        ...rule,
        type: rule.type || ('text' as any),
      };
    }

    return {
      type: rule as any,
    };
  }

  /**
   * performs the conditional if resolution
   * @param conditionalIf
   */
  private resolveConditionalIf(conditionalIf: RequiredIf<F>): boolean {
    const targetField = conditionalIf.field;
    const targetFieldRule = this.makeObjectRule(this.rules[targetField]);

    let status = false;

    const filteredValue = this.filterValue(
      targetFieldRule.type,
      targetFieldRule.filters,
      pickValue(this.dataSource, targetField, '')
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
        status = conditionalIf.list.includes(filteredValue as any);
        break;

      case 'notIn':
        status = !conditionalIf.list.includes(filteredValue as any);
        break;

      case 'contains':
        status =
          isArray(filteredValue) &&
          filteredValue.includes(conditionalIf.value as never);
        break;

      case 'notContains':
        status =
          isArray(filteredValue) &&
          !filteredValue.includes(conditionalIf.value as never);
        break;
    }
    return status;
  }

  /**
   * resolves the rule and returns the result
   */
  private resolveRule(
    field: F,
    rule: Rule<F> | DataType
  ): ResolvedRule<F> | null {
    rule = this.makeObjectRule(rule);

    const type = rule.type;

    const result: ResolvedRule<F> = {
      // the type
      type,

      // if the field type is checkbox, or a default value was provided, then required is defaulted to false
      required: pickValue(
        rule,
        'required',
        type === 'checkbox' || !isUndefined(rule.defaultValue) ? false : true
      ),

      // we assume the field value is a list if the field name is pluralized
      isList: pickValue(
        rule,
        'isList',
        pluralize(field) === field && type !== 'boolean' && type !== 'checkbox'
      ),

      // pick the default value
      defaultValue: pickValue(rule, 'defaultValue', ''),

      // hint is the error message to display if the field is missing and it is required
      hint: pickValue(rule, 'hint', `${field} is required`),

      // validation options
      options: pickObject(rule, 'options'),

      // filters to perform on the data
      filters: pickObject(rule, 'filters'),

      // database checks to perform
      checks: makeArray(rule.checks),

      // a post data computation callback
      compute: pickValue(rule, 'compute'),

      // your own callback to carry out extra validation logic
      validate: pickValue(rule, 'validate'),
    };

    // resolve required if condition
    if (isObject<RequiredIf<F>>(rule.required)) {
      result.required = false;
      if (this.resolveConditionalIf(rule.required)) {
        result.required = true;
      }
      // by default, if a rule is required conditionally based on another field, we drop the rule if the condition is not satisfied.
      else if (rule.required.dropOnFail !== false) {
        return null;
      }
    }

    //enclose the shouldMatch target field in braces
    if (result.options.shouldMatch) {
      if (isString(result.options.shouldMatch)) {
        result.options.shouldMatch = { target: result.options.shouldMatch };
      }
      result.options.shouldMatch.target =
        `{${result.options.shouldMatch.target}}` as F;
    }
    return result;
  }

  /**
   * resolves the given rules
   */
  private resolveRules() {
    const rules = this.rules as Rules<F>;

    this.resolvedRules = Object.keys(rules).reduce((result, field: F) => {
      const resolvedRule = this.resolveRule(field, rules[field]);
      if (resolvedRule) {
        result[field] = resolvedRule;
      }
      return result;
    }, {} as ResolvedRules<F>);

    //if there is a file field, and the user did not set the files object, throw
    if (
      !this.filesSource &&
      Object.keys(this.resolvedRules).some((field) => this.isFileField(field))
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
        return arg.map((current) => resolveData(current));
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
    this.validator = validator;
    this.validator.setErrorBag(this.errors);
    return this;
  }

  /**
   * sets the db adapter instance to use
   */
  setDBAdapter(dbAdapter: Adapter<F>): this {
    if (dbAdapter) {
      this.dbAdapter = dbAdapter;
      this.dbAdapter.setErrorBag(this.errors);
    }
    return this;
  }

  /**
   * sets the instance database field case style
   * @param dbCaseStyle
   */
  setDBCaseStyle(dbCaseStyle: number) {
    this.dbCaseStyle = dbCaseStyle;
    this.setDBAdapter(this.dbAdapter);
    return this;
  }

  /**
   * sets the instance database type
   * @param dbType
   */
  setDBType(dbType: number) {
    this.dbType = dbType;
    this.setDBAdapter(this.dbAdapter);
    return this;
  }

  /**
   * sets the error message
   */
  setError(field: string, errorMessage: string | false): this {
    this.errors[field] = isString(errorMessage)
      ? errorMessage
      : 'error occured';
    return this;
  }

  /**
   * this adds extra field to the data to be validated.
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
    Object.keys(fields).forEach((field) => {
      this.addField(field, fields[field]);
    });
    return this;
  }

  /**
   * asynchronously executes the handler instance
   *
   * @param validateOnDemand boolean value indicating if it should only pick and validate
   * fields that were sent and whose rules are defined. perfect when performing data updates
   *
   * @param requiredFields field or array of fields that must be included when validating on
   * demand, even if they were not sent.
   */
  async execute(
    validateOnDemand: boolean = false,
    requiredFields: F[] | F = []
  ): Promise<boolean> {
    this.shouldExecute();
    this.executed = true;

    // copy fields
    this.dataSource = copy({}, this.dataSource as DataSource, this.addedFields);
    this.filesSource = this.filesSource && copy({}, this.filesSource);

    this.resolveRules();

    if (validateOnDemand) {
      this.filterRules(makeArray(requiredFields));
    }

    //resolve hints
    this.resolveOptions('hint');

    if (!this.checkMissingFields()) {
      return false;
    }

    this.getFieldsData();

    if (!this.checkLists()) {
      return false;
    }

    this.resolveOptions('options');
    this.resolveOptions('checks');

    if ((await this.validateFields()) && (await this.validateDBChecks())) {
      await this.runPostProcesses();
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
