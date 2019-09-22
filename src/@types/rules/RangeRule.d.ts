import BaseRule, { BaseOptions } from './BaseRule';

declare interface TextRangeOptions extends BaseOptions {
  /**
   * range start alphabet
   */
  from: string;
  /**
   * range end alphabet
   */
  to: string;
  /**
   * optional range step value, defaults to 1
   */
  step?: number;
}

declare interface NumberRangeOptions extends BaseOptions {
  /**
   * range start number
   */
  from: number;
  /**
   * range end number
   */
  to: number;
  /**
   * optional range step value. defaults to 1
   */
  step?: number;
}

export type RangeOptions = TextRangeOptions | NumberRangeOptions;

//range rule
export default interface RangeRule<F extends string> extends BaseRule<F> {
  type: 'range';
  /**
   * defines validation options to be used for range ield type validations
   */
  options: RangeOptions;
}
