import Exception from '.';

/**
 * rules not set exception
 */
export default class RulesNotSetException extends Exception {
  constructor(message: string = 'validation rules not found') {
    super(message, RulesNotSetException);
  }
}
