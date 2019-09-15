import Exception from '.';

export default class FileMoveException extends Exception {
  constructor(message: string) {
    super('Error occured while moving file: ' + message, FileMoveException);
  }
}
