import { ErrorBag, Options } from './@types';
import { isNumeric } from '@forensic-js/utils';
import { replaceCallback } from '@forensic-js/regex';
import StateException from './Exceptions/StateException';
import { ModelDBCheck } from './@types/rules/BaseRule';

export default class Common<F extends string = string> {
  protected errors: ErrorBag<F> = {} as ErrorBag<F>;

  private status: boolean = true;

  protected field: string = '';

  protected options: Options<F> | ModelDBCheck = {};

  protected index: number = 0;

  protected shouldProceed: boolean = true;

  /**
   * resets the instance and makes it ready for the next validation process
   *
   * @param field next field to validate
   * @param options validation options
   * @param index field value index
   */
  reset(
    field: string,
    options: Options<F> | ModelDBCheck,
    index: number
  ): this {
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
  setError(errorMessage: string | false, value: string): false {
    errorMessage = errorMessage === false ? 'error occured' : errorMessage;

    if (this.status === false) {
      throw new StateException(
        'cant set errors twice, did you forget to reset validator?'
      );
    }
    if (!isNumeric(value)) {
      value = `"${value}"`;
    }

    this.errors[this.field] = replaceCallback(
      /\{([^}]+)\}/,
      matches => {
        switch (matches[1].toLowerCase()) {
          case 'this':
            return value;

          case '_this':
            return this.field;

          case '_index':
            return (this.index + 1).toString();
          default:
            return matches[0];
        }
      },
      errorMessage
    );

    return (this.status = false);
  }

  /**
   * sets the error bag if given
   */
  setErrorBag(errorBag: ErrorBag<F>): this {
    this.errors = errorBag;
    return this;
  }

  /**
   * returns the errobag object containing all errors
   */
  getErrorBag(): ErrorBag<F> {
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
