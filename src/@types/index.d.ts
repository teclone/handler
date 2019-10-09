import CustomDate from '../CustomDate';
import { BooleanRule, CheckboxRule } from './rules/BooleanRules';
import {
  TextRule,
  EmailRule,
  URLRule,
  PasswordRule,
  TextOptions,
  PhoneNumberRule,
  PhoneNumberOptions,
  PasswordOptions,
} from './rules/TextRules';
import {
  IntegerRule,
  NIntegerRule,
  PIntegerRule,
  NumberRule,
  NNumberRule,
  PNumberRule,
  DateRule,
  NumberOptions,
} from './rules/NumberRules';
import RangeRule, { RangeOptions } from './rules/RangeRule';
import ChoiceRule, { ChoiceOptions } from './rules/ChoiceRule';
import BaseRule, { BaseOptions, SuccessOrErrorMessage } from './rules/BaseRule';
import {
  FileRule,
  ImageFileRule,
  AudioFileRule,
  VideoFileRule,
  MediaFileRule,
  DocumentFileRule,
  ArchiveFileRule,
  FileOptions,
} from './rules/FilesRule';
import Handler from '../Handler';

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface FileEntryCollection {
  name: string[];
  path: string[];
  size: number[];
  type: string[];
}

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

export type DBCheckType = 'exists' | 'notExists';

export type RequiredIf<F extends string> =
  | {
      if: 'checked' | 'notChecked';
      field: F;
      /**
       * indicates if the fields value should be dropped if the field ends up not being required (needed), defaults to true
       */
      drop?: boolean;
    }
  | {
      if: 'equals' | 'notEquals' | 'in' | 'notIn';
      field: F;
      value: string | boolean | number;
      /**
       * indicates if the fields value should be dropped if the field ends up not being required (needed), defaults to true
       */
      drop?: boolean;
    };

export type OverrideIf<F extends string> =
  | {
      if: 'checked' | 'notChecked';
      field: F;
      with: RawData;
    }
  | {
      if: 'equals' | 'notEquals' | 'in' | 'notIn';
      field: F;
      value: string | boolean | number;
      with: RawData;
    };

export type FilterCallback = (value: string) => string | number | boolean;

export interface Filters {
  decode?: boolean;
  toArray?: boolean;
  stripTags?: boolean;
  stripTagsIgnore?: string | string[];
  minimize?: boolean;
  trim?: boolean;
  toNumeric?: boolean;
  toUpper?: boolean;
  toLower?: boolean;
  capitalize?: boolean;
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

export interface ModelDBCheck {
  if: DBCheckType;
  model: object;
  field?: string;
  query?: object;
  err?: string;
}
export interface CallbackDBCheck {
  if: DBCheckType;
  callback: (fieldName: string, fieldValue: DataValue, fieldIndex: number) => Promise<boolean>;
  err?: string;
}
export type DBCheck = CallbackDBCheck | ModelDBCheck;

export type Rule<F extends string> =
  | BooleanRule<F>
  | CheckboxRule<F>
  | TextRule<F>
  | EmailRule<F>
  | URLRule<F>
  | PasswordRule<F>
  | PhoneNumberRule<F>
  | IntegerRule<F>
  | NIntegerRule<F>
  | PIntegerRule<F>
  | NumberRule<F>
  | NNumberRule<F>
  | PNumberRule<F>
  | DateRule<F>
  | RangeRule<F>
  | ChoiceRule<F>
  | FileRule<F>
  | ImageFileRule<F>
  | AudioFileRule<F>
  | VideoFileRule<F>
  | MediaFileRule<F>
  | DocumentFileRule<F>
  | ArchiveFileRule<F>;

export type Rules<F extends string> = {
  [P in F]: DataType | Rule<F>;
};

export interface ResolvedRule<F extends string> {
  type: DataType;

  required: boolean;

  hint: string;

  defaultValue: RawData | undefined;

  requiredIf?: RequiredIf<F>;

  overrideIf?: OverrideIf<F>;

  options: Options<F>;

  filters: Filters;

  checks: DBCheck[];

  /**
   * computes and return a new value for the field. it accepts two arguments
   * field value, and data object
   */
  postCompute?: <N extends Handler<F> = Handler<F>>(
    value: DataValue,
    data: Data<F>,
    handler: N
  ) => Promise<DataValue> | DataValue;

  /**
   * runs a post validation process on the field. returns true if validation succeeds or returns
   * error message if validation fails
   */
  postValidate?: <N extends Handler<F> = Handler<F>>(
    value: DataValue,
    data: Data<F>,
    handler: N
  ) => Promise<SuccessOrErrorMessage> | SuccessOrErrorMessage;
}

export type ResolvedRules<F extends string> = {
  [P in F]: ResolvedRule<F>;
};

export type DateConverter = (value: string) => CustomDate;
