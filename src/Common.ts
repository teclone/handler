import { ErrorBag } from './@types';
import { isNumeric } from '@teclone/utils';
import { replaceCallback } from '@teclone/regex';
import { StateException } from './Exceptions/StateException';
import { SingleDataValue } from './@types/rules/BaseRule';

export class Common<F extends string = string> {
  protected errors: ErrorBag<F> = {} as ErrorBag<F>;

  private status: boolean = true;

  protected field: string = '';

  // protected options: Options<F> | ModelDBCheck<F> = {};

  protected index: number = 0;

  protected transformedValue: SingleDataValue;

  /**
   * resets the instance and makes it ready for the next validation process
   *
   * @param field next field to validate
   * @param options validation options
   * @param index field value index
   */
  reset(field: string, value: SingleDataValue, index: number): this {
    this.field = field;
    this.index = index;
    this.status = true;

    this.transformedValue = value;

    return this;
  }

  /**
   * sets the given error message
   */
  setError(errorMessage: string | false, value: string): false {
    errorMessage = errorMessage === false ? 'error occured' : errorMessage;

    if (this.status === false) {
      throw new StateException(
        'cannot set errors twice, did you forget to reset?'
      );
    }

    if (!isNumeric(value)) {
      value = `"${value}"`;
    }

    this.errors[this.field] = replaceCallback(
      /\{([^}]+)\}/,
      (matches) => {
        switch (matches[1].toLowerCase()) {
          case 'value':
            return value;

          case 'name':
            return this.field;

          case 'index':
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

  getTransformedValue() {
    return this.transformedValue;
  }
}
