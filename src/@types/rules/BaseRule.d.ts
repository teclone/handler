import { DataValue, RequiredIf, Filters, DBCheck, DataType, OverrideIf, Data } from '..';
import Handler from '../../Handler';

export interface ShouldMatchObject {
  /**
   * the target field
   */
  target: string;

  /**
   * optional error message to use if values did not match
   */
  err?: string;
}

export interface BaseOptions {
  /**
   * defines a target field that this field value must match
   */
  shouldMatch?: ShouldMatchObject | string;

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
   * defines a condition which if satisfied, overrides the field's raw value
   */
  overrideIf?: OverrideIf<F>;

  /**
   * defines a list of filteration operations to carry out on the field value(s)
   */
  filters?: Filters;

  /**
   * defines a list of database integrity checks to perform on the field value(s)
   */
  checks?: DBCheck | DBCheck[];

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
  ) => Promise<true | string> | true | string;
}
