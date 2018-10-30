export default class Exception {

    /**
     *@param {string} [message=''] - the error message
     *@param {Object} [domain=Exception] - the error class
    */
    constructor(message, domain) {

        const construct = (domain || Exception).prototype.constructor;
        this.message = message;
        this.name = construct.name;

        Error.captureStackTrace(this);
    }
}

Exception.prototype = new Error();