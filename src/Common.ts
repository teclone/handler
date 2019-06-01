import { ErrorBag, DBCheck, Options } from './@types';
import { isNumeric } from '@forensic-js/utils';
import { replaceCallback } from '@forensic-js/regex';
import StateException from './Exceptions/StateException';

export default class Common {

    protected errors: ErrorBag = {};

    private status: boolean = true;

    protected field: string = '';

    protected options: Options | DBCheck = {};

    protected index: number = 0;

    protected shouldProceed: boolean = true;

    constructor(errorBag?: ErrorBag) {
        this.setErrorBag(errorBag);
    }

    /**
     * resets the instance and makes it ready for the next validation process
     *
     * @param field next field to validate
     * @param options validation options
     * @param index field value index
     */
    reset(field: string, options: Options | DBCheck, index: number): this {

        this.field = field;
        this.options = options;
        this.index = index;

        this.shouldProceed = true;
        this.status = true;

        return this;
    }

    /**
     * sets the given error message
    */
    setError(errorMessage: string, value: string): false {
        if (this.status === false) {
            throw new StateException('cant set errors twice, did you forget to reset validator?');
        }
        if (!isNumeric(value)) {
            value = `"${value}"`;
        }

        this.errors[this.field] = replaceCallback(/\{([^}]+)\}/, (matches) => {
            switch(matches[1].toLowerCase()) {
                case 'this':
                    return value;

                case '_this':
                    return this.field;

                case '_index':
                    return (this.index + 1).toString();
                default:
                    return matches[0];
            }
        }, errorMessage);

        return this.status = false;
    }

    /**
     * sets the error bag if given
     */
    setErrorBag(errorBag?: ErrorBag): this {
        if (errorBag) {
            this.errors = errorBag;
        }
        return this;
    }

    /**
     * returns the errobag object containing all errors
     */
    getErrorBag(): ErrorBag {
        return this.errors;
    }

    /**
     * returns true if the last validation succeeded
     */
    succeeds(): boolean {
        return this.status;
    }

    /**
     * returns true if the last validation failed
     */
    fails(): boolean {
        return !this.succeeds();
    }
}