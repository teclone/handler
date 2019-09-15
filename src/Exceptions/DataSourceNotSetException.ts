import Exception from '.';

/**
 * data source not set exception
 */
export default class DataSourceNotSetException extends Exception {
  constructor(message: string = 'data source not found') {
    super(message, DataSourceNotSetException);
  }
}
