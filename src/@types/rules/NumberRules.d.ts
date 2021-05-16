import BaseRule, { BaseOptions } from './BaseRule';

export interface NumberOptions<F extends string> extends BaseOptions<F> {
  /**
   * the minimum accepted value or length
   */
  min?: number | string;
  /**
   * optional error message to use if min validation fails
   */
  minErr?: string;

  /**
   * the maximum accepted value or length
   */
  max?: number | string;
  /**
   * optional error message to use if max validation fails
   */
  maxErr?: string;

  /**
   * defines a base value or length that this field value or length must be greater than
   */
  gt?: number | string;
  /**
   * optional error message to use if gt validation fails
   */
  gtErr?: string;

  /**
   * defines a base value or length that this field value or length must be lesser than
   */
  lt?: number | string;
  /**
   * optional error message to use if lt validation fails
   */
  ltErr?: string;
}

interface NumberRule<F extends string> extends BaseRule<F> {
  type:
    | 'int'
    | 'nInt'
    | 'pInt'
    | 'number'
    | 'money'
    | 'nNumber'
    | 'pNumber'
    | 'date';

  /**
   * defines validation options to be used for number related field type validations
   * such as ints, numbers and dates
   */
  options?: NumberOptions<F>;
}
