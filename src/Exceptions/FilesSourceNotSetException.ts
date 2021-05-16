import { Exception } from '.';

/**
 * files source not set exception
 */
export class FilesSourceNotSetException extends Exception {
  constructor(message: string = 'files source not found') {
    super(message, FilesSourceNotSetException);
  }
}
