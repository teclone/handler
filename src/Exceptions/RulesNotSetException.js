import Exception from './Exception';

/**
 * rules not set exception
*/
export default class RulesNotSetException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, RulesNotSetException);
    }
}