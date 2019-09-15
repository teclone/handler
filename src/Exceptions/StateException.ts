import Exception from '.';

/**
 * state exception
 */
export default class StateException extends Exception {
  /**
   *@param {string} message - error message
   */
  constructor(message) {
    super(message, StateException);
  }
}
