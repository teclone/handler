import { Exception } from '.';

/**
 * data source not set exception
 */
export class DataSourceNotSetException extends Exception {
  constructor(message: string = 'data source not found') {
    super(message, DataSourceNotSetException);
  }
}
