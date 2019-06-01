import { DataValue, RequiredIf, Filters, DBCheck, DataType } from '..';

export declare interface ShouldMatchObject {
    /**
     * the target field
     */
    target: string;

    /**
     * optional error message to use if values did not match
     */
    err?: string;
}

export declare interface BaseOptions {
    /**
     * defines a target field that this field value must match
     */
    shouldMatch?: ShouldMatchObject | string;

    /**
     * optional error message to use if field validation fails
     */
    err?: string;
}

export default interface BaseRule {

    /**
     * field type. determines the kind of validations to perform on the field value(s)
     */
    type?: DataType;

    /**
     * indicates if field is required
     */
    required?: boolean;

    /**
     * optional error message to use if field is required but is missing
     */
    hint?: string;

    /**
     * default value to use for optional fields that are missing
     */
    defaultValue?: DataValue;

    /**
     * defines a condition which if satisfied, makes the field required, otherwise, the field
     * becomes optional
     */
    requiredIf?: RequiredIf;

    /**
     * defines a list of filteration operations to carry out on the field value(s)
     */
    filters?: Filters;

    /**
     * defines a list of database integrity checks to perform on the field value(s)
     */
    checks?: DBCheck | DBCheck[];
}