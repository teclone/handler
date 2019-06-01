import Exception from '.';

export default class DirectoryNotFoundException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message: string) {
        super(message, DirectoryNotFoundException);
    }
}