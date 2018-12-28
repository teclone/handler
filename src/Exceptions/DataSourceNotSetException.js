import Exception from './Exception';

/**
 * data source not set exception
*/
export default class DataSourceNotSetException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, DataSourceNotSetException);
    }
}