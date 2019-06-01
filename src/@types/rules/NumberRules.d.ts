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

declare interface BaseNumberRule extends BaseRule {
    /**
     * defines validation options to be used for number related field type validations
     * such as ints, numbers and dates
     */
    options?: NumberOptions;
}

//number rules
export declare interface IntegerRule extends BaseNumberRule {
    type: 'int';
}

export declare interface NIntegerRule extends BaseNumberRule {
    type: 'nInt';
}

export declare interface PIntegerRule extends BaseNumberRule {
    type: 'pInt';
}

export declare interface NumberRule extends BaseNumberRule {
    type: 'number' | 'money';
}

export declare interface NNumberRule extends BaseNumberRule {
    type: 'nNumber';
}

export declare interface PNumberRule extends BaseNumberRule {
    type: 'pNumber';
}

export declare interface DateRule extends BaseNumberRule {
    type: 'date';
}