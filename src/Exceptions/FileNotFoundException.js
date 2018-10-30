import Exception from './Exception';

/**
 * generic FileNotFoundException
*/
export default class FileNotFoundException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, FileNotFoundException);
    }
}