import Exception from '.';

export default class FileException extends Exception {
  constructor(message: string) {
    super('Error occured while moving file: ' + message, FileException);
  }
}
