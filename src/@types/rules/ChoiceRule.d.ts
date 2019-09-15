import BaseRule, { BaseOptions } from './BaseRule';

export declare interface ChoiceOptions extends BaseOptions {
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
  options: ChoiceOptions;
}
