import BaseRule, { BaseOptions } from './BaseRule';

export declare interface NumberOptions extends BaseOptions {
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

declare interface BaseNumberRule<F extends string> extends BaseRule<F> {
    /**
     * defines validation options to be used for number related field type validations
     * such as ints, numbers and dates
     */
    options?: NumberOptions;
}

//number rules
export declare interface IntegerRule<F extends string> extends BaseNumberRule<F> {
    type: 'int';
}

export declare interface NIntegerRule<F extends string> extends BaseNumberRule<F> {
    type: 'nInt';
}

export declare interface PIntegerRule<F extends string> extends BaseNumberRule<F> {
    type: 'pInt';
}

export declare interface NumberRule<F extends string> extends BaseNumberRule<F> {
    type: 'number' | 'money';
}

export declare interface NNumberRule<F extends string> extends BaseNumberRule<F> {
    type: 'nNumber';
}

export declare interface PNumberRule<F extends string> extends BaseNumberRule<F> {
    type: 'pNumber';
}

export declare interface DateRule<F extends string> extends BaseNumberRule<F> {
    type: 'date';
}