import Exception from './Exception';

/**
 * directory not found exception
*/
export default class DirectoryNotFoundException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, DirectoryNotFoundException);
    }
}