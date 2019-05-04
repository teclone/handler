import BaseRule, {BaseOptions} from './BaseRule';

// boolean rules
export declare interface BooleanRule extends BaseRule {
    type: 'boolean';
    /**
     * defines validation options to perform on the boolean field
     */
    options?: BaseOptions;
}

export declare interface CheckboxRule extends BaseRule {
    type: 'checkbox';
    /**
     * defines validation options to perform on the checkbox field
     */
    options?: BaseOptions;
}