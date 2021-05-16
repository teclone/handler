import { Exception } from '.';

/**
 * state exception
 */
export class StateException extends Exception {
  /**
   *@param {string} message - error message
   */
  constructor(message) {
    super(message, StateException);
  }
}
