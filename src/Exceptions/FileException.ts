import { Exception } from '.';

export class FileException extends Exception {
  constructor(message: string) {
    super('Error occured while moving file: ' + message, FileException);
  }
}
