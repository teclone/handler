import BaseRule, {BaseOptions} from './BaseRule';

// boolean rules
export declare interface BooleanRule<F extends string> extends BaseRule<F> {
    type: 'boolean';
    /**
     * defines validation options to perform on the boolean field
     */
    options?: BaseOptions;
}

export declare interface CheckboxRule<F extends string> extends BaseRule<F> {
    type: 'checkbox';
    /**
     * defines validation options to perform on the checkbox field
     */
    options?: BaseOptions;
}