import BaseRule, { BaseOptions } from './BaseRule';

export interface ChoiceOptions<F extends string> extends BaseOptions<F> {
  /**
   * array of choice options
   */
  choices: (string | number | boolean)[];
}

export default interface ChoiceRule<F extends string> extends BaseRule<F> {
  type: 'choice';
  /**
   * defines validation options to be used for choice field type validations
   */
  options: ChoiceOptions<F>;
}
