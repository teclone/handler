import Exception from '.';

/**
 * files source not set exception
 */
export default class FilesSourceNotSetException extends Exception {
  constructor(message: string = 'files source not found') {
    super(message, FilesSourceNotSetException);
  }
}
