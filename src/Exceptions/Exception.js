/**
 * exception base class
*/
export default class Exception extends Error {

    /**
     *@param {string} [message=''] - error message
     *@param {Object} [domain=Exception] - error class
    */
    constructor(message, domain) {
        super(message);

        const construct = (domain || Exception).prototype.constructor;
        this.message = message;
        this.name = construct.name;

        Error.captureStackTrace(this);
    }
}