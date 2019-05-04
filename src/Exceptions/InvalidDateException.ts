import Exception from '.';

export default class InvalidDateException extends Exception {

    constructor(date: string) {
        super(`${date} is not a valid date`, InvalidDateException);
    }
}