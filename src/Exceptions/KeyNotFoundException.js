import Exception from './Exception';

/**
 * key not found exception
*/
export default class KeyNotFoundException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, KeyNotFoundException);
    }
}