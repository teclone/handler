import { DataValue, RequiredIf, Filters, DataType, Data } from '..';
import Handler from '../../Handler';

export type SuccessOrErrorMessage = boolean | string;

export type DBCheckType = 'exists' | 'notExists';

export interface ModelDBCheck {
  if: DBCheckType;
  model: object;
  field?: string;
  query?: object;
  err?: string;
}

export type DBCheckCallback<F extends string> = (
  value: DataValue,
  index: number,
  data: Data<F>,
  handler: Handler<F>
) => Promise<SuccessOrErrorMessage> | SuccessOrErrorMessage;

export type DBCheck<F extends string> = DBCheckCallback<F> | ModelDBCheck;

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
  type?: DataType;

  /**
   * indicates if field is required
   */
  required?: boolean;

  /**
   * indicates if field value should be an array. by default, fields whose names are in plural forms are considered to accept multiple
   * values. if not specified as true, and field name is pluralized, array values are rejected
   */
  array?: boolean;

  /**
   * optional error message to use if field is required but is missing
   */
  hint?: string;

  /**
   * default value to use for optional fields that are missing
   */
  defaultValue?: DataValue;

  /**
   * defines a condition which if satisfied, makes the field required, otherwise, the field
   * becomes optional
   */
  requiredIf?: RequiredIf<F>;

  /**
   * defines a list of filteration operations to carry out on the field value(s)
   */
  filters?: Filters;

  /**
   * defines a list of database integrity checks to perform on the field value(s)
   */
  checks?: DBCheck<F> | DBCheck<F>[];

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

  options?: BaseOptions<F>;
}
