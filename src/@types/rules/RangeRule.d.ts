import BaseRule, { BaseOptions } from './BaseRule';

interface TextRangeOptions<F extends string> extends BaseOptions<F> {
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

interface NumberRangeOptions<F extends string> extends BaseOptions<F> {
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

export type RangeOptions<F extends string> =
  | TextRangeOptions<F>
  | NumberRangeOptions<F>;

//range rule
export default interface RangeRule<F extends string> extends BaseRule<F> {
  type: 'range';

  /**
   * defines validation options to be used for range ield type validations
   */
  options?: RangeOptions<F>;
}
