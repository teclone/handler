import Exception from './Exception';

/**
 * generic KeyNotFoundException
*/
export default class KeyNotFoundException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, KeyNotFoundException);
    }
}