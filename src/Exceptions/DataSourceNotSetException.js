import Exception from './Exception';

/**
 * generic DataSourceNotSetException
*/
export default class DataSourceNotSetException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, DataSourceNotSetException);
    }
}