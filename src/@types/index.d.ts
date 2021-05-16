import CustomDate from '../CustomDate';
import { BooleanRule, CheckboxRule } from './rules/BooleanRules';
import {
  TextRule,
  URLRule,
  PasswordRule,
  TextOptions,
  PhoneNumberRule,
  PhoneNumberOptions,
  PasswordOptions,
} from './rules/TextRules';
import { NumberRule, NumberOptions } from './rules/NumberRules';
import RangeRule, { RangeOptions } from './rules/RangeRule';
import ChoiceRule, { ChoiceOptions } from './rules/ChoiceRule';
import BaseRule, {
  BaseOptions,
  SuccessOrErrorMessage,
  ModelDBCheck,
  ComputeCallback,
  ValidateCallback,
  DBCheckCallback,
} from './rules/BaseRule';
import { FileRule, FileOptions } from './rules/FilesRule';
import Handler from '../Handler';
import { FileEntry, FileEntryCollection } from '@teclone/r-server/lib/@types';

export type RawData = string | string[];

export type DataSource = {
  [field: string]: RawData;
};

export interface FilesSource {
  [fieldName: string]: FileEntry | FileEntryCollection;
}

export type DataValue =
  | null
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | FileEntry
  | FileEntryCollection;

export type Data<F extends string> = {
  [P in F]: DataValue;
};

export interface CustomData {
  [P: string]: any;
}

export type ErrorBag<F extends string> = {
  [P in F]: string;
};

export type Unit = 'character' | 'number' | 'date' | 'file';

export interface RegexObject {
  pattern: RegExp;
  err?: string;
}

export type Regex = RegExp | RegexObject;

export type DataType =
  | 'checkbox'
  | 'boolean'
  | 'text'
  | 'title'
  | 'name'
  | 'objectId'
  | 'email'
  | 'url'
  | 'phoneNumber'
  | 'password'
  | 'int'
  | 'pInt'
  | 'nInt'
  | 'number'
  | 'pNumber'
  | 'nNumber'
  | 'money'
  | 'date'
  | 'range'
  | 'choice'
  | 'file'
  | 'image'
  | 'audio'
  | 'video'
  | 'media'
  | 'document'
  | 'archive';

export interface BaseRequiredIfRule<F extends string> {
  if:
    | 'checked'
    | 'notChecked'
    | 'equals'
    | 'notEquals'
    | 'in'
    | 'notIn'
    | 'contains'
    | 'notContains';

  /**
   * indicates if the fields value should be dropped if the field ends up not being required (needed), defaults to true
   */
  dropOnFail?: boolean;

  /**
   * the target field
   */
  field?: F;
}

export interface RequiredIfCheckRule<F extends string>
  extends BaseRequiredIfRule<F> {
  if: 'checked' | 'notChecked';
}

export interface RequiredIfEqualRule<F extends string>
  extends BaseRequiredIfRule<F> {
  if: 'equals' | 'notEquals';
  value: string | boolean | number;
}

export interface RequiredIfInRule<F extends string>
  extends BaseRequiredIfRule<F> {
  if: 'in' | 'notIn';
  list: Array<string | boolean | number>;
}

export interface RequiredIfContainRule<F extends string>
  extends BaseRequiredIfRule<F> {
  if: 'contains' | 'notContains';
  value: string | boolean | number;
}

export type RequiredIf<F extends string> =
  | RequiredIfCheckRule<F>
  | RequiredIfEqualRule<F>
  | RequiredIfInRule<F>
  | RequiredIfContainRule<F>;

export type FilterCallback = (value: string) => string | number | boolean;

export interface Filters {
  /**
   * if true, duplicate values will be removed from the field value if it is an array of items.
   */
  unique?: boolean;

  /**
   * indicates if value should be decoded
   */
  decode?: boolean;

  /**
   * indicates if html tags should be stripped out
   */
  stripTags?: boolean;

  /**
   * lists a number of html tags to ignore while stripping out tags
   */
  stripTagsIgnore?: string | string[];

  /**
   *
   */
  minimize?: boolean;

  trim?: boolean;

  /**
   * converts to number
   */
  toNumeric?: boolean;

  /**
   * indicates if the whole values should be uppercase
   */
  uppercase?: boolean;

  /**
   * indicates if value should be lowercased
   */
  lowercase?: boolean;

  /**
   * indicates if value should be capitalized
   */
  capitalize?: boolean;

  /**
   * indicates if value should be camel cased
   */
  camelize?: boolean;

  /**
   * indicates if value should be titleized, titled string starts every key word with capital letter
   */
  titleize?: boolean;

  ordinalize?: boolean;
  pluralize?: boolean;
  singularize?: boolean;

  callback?: FilterCallback;
}

export type Options<F extends string> =
  | BaseOptions<F>
  | NumberOptions<F>
  | TextOptions<F>
  | RangeOptions<F>
  | ChoiceOptions<F>
  | FileOptions<F>
  | PhoneNumberOptions<F>
  | PasswordOptions<F>;

export type Rule<F extends string> =
  | BooleanRule<F>
  | CheckboxRule<F>
  | TextRule<F>
  | URLRule<F>
  | PasswordRule<F>
  | PhoneNumberRule<F>
  | NumberRule<F>
  | FileRule<F>
  | ChoiceRule<F>
  | RangeRule<F>;

export type Rules<F extends string> = {
  [P in F]: DataType | Rule<F>;
};

export interface ResolvedRule<F extends string> {
  type: DataType;

  required: boolean;

  /**
   * boolean indicating if the field value is array of items
   */
  isList: boolean;

  /**
   * missing field error message
   */
  hint: string;

  /**
   * default value
   */
  defaultValue: RawData | FileEntry | FileEntryCollection;

  options: Options<F>;

  filters: Filters;

  /**
   * defines a list of database integrity checks to perform on the field value(s)
   */
  // note: this should be left as it to avoid typescript complaints
  checks: Array<DBCheckCallback<F> | ModelDBCheck>;

  /**
   * computes and return a new value for the field. it accepts two arguments
   * field value, and data object
   *
   * compute callback is called after all validations has been passed
   */
  compute?: ComputeCallback<F>;

  /**
   * runs custom validation on the field. return true if validation succeeds or return false or error message if validation fails
   */
  validate?: ValidateCallback<F>;
}

export type ResolvedRules<F extends string> = {
  [P in F]: ResolvedRule<F>;
};

export type DateConverter = (value: string) => CustomDate;
