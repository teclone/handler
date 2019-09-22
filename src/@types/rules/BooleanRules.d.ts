import BaseRule, { BaseOptions } from './BaseRule';

// boolean rules
export interface BooleanRule<F extends string> extends BaseRule<F> {
  type: 'boolean';
  /**
   * defines validation options to perform on the boolean field
   */
  options?: BaseOptions;
}

export interface CheckboxRule<F extends string> extends BaseRule<F> {
  type: 'checkbox';
  /**
   * defines validation options to perform on the checkbox field
   */
  options?: BaseOptions;
}
