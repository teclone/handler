import Exception from './Exception';

/**
 * file not found exception
*/
export default class FileNotFoundException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, FileNotFoundException);
    }
}