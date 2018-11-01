import Exception from './Exception';

/**
 * generic RulesNotSetException
*/
export default class RulesNotSetException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, RulesNotSetException);
    }
}