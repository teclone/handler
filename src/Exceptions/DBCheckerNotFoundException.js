import Exception from './Exception';

/**
 * generic DBCheckerNotFoundException
*/
export default class DBCheckerNotFoundException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, DBCheckerNotFoundException);
    }
}