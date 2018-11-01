import Exception from './Exception';

/**
 * generic StateException
*/
export default class StateException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, StateException);
    }
}