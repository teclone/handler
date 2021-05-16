import { FileEntry, FileEntryCollection } from '@teclone/r-server/lib/@types';
import { DataValue, RequiredIf, Filters, DataType, Data } from '..';
import Handler, { Handler, Handler, Handler } from '../../Handler';

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

export type SingleDataValue = string | number | boolean | FileEntry;

export type SuccessOrErrorMessage = boolean | string;

export type DBCheckType = 'itExists' | 'itDoesNotExist';

export type ArrayLike<T> = T | T[];

export type DBCheckCallback<F extends string> = (
  field: F,
  value: SingleDataValue,
  index: number,
  handler: Handler<F>
) => SuccessOrErrorMessage | Promise<SuccessOrErrorMessage>;

export type ValidateCallback<F extends string> = (
  field: F,
  value: string | FileEntry,
  index: number,
  handler: Handler<F>
) => SuccessOrErrorMessage;

export type ComputeCallback<F extends string> = (
  field: F,
  value: DataValue,
  handler: Handler<F>
) => DataValue | Promise<DataValue>;

export interface ModelDBCheck<F extends string> {
  /**
   * check that the condition is satisfied, if not satisfied, it is an error.
   */
  that: DBCheckType;
  model: object;
  field?: string;
  query?:
    | object
    | ((
        fieldType: DataType,
        field: F,
        value: SingleDataValue,
        index: number,
        handler: Handler<F>
      ) => object);
  err?: string;
}

export interface ShouldMatchObject<F extends string> {
  /**
   * the target field
   */
  target: F;

  /**
   * optional error message to use if values did not match
   */
  err?: string;
}

export interface BaseOptions<F extends string> {
  /**
   * defines a target field that this field value must match
   */
  shouldMatch?: ShouldMatchObject<F> | F;

  /**
   * optional error message to use if field validation fails
   */
  err?: string;
}

export default interface BaseRule<F extends string> {
  /**
   * field type. determines the kind of validations to perform on the field value(s)
   */
  type: DataType;

  /**
   * indicates if field is required, or a condition which if satisifed, makes the field required
   */
  required?: boolean | RequiredIf;

  /**
   * indicates if field value should be an array. by default, fields whose names are in plural forms are considered to accept multiple
   * values. if not specified as true, and field name is pluralized, array values are rejected
   */
  isList?: boolean;

  /**
   * optional error message to use if field is required but is missing
   */
  hint?: string;

  /**
   * default value to use for optional fields that are missing
   */
  defaultValue?: DataValue;

  /**
   * defines a list of filteration operations to carry out on the field value(s)
   */
  filters?: Filters;

  /**
   * defines a list of database integrity checks to perform on the field value(s)
   */
  checks?: ArrayLike<DBCheckCallback<F> | ModelDBCheck<F>>;

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
  validate?: ValidateCallback;

  options?: BaseOptions<F>;
}
