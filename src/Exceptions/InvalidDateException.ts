import { Exception } from '.';

export class InvalidDateException extends Exception {
  constructor(date: string) {
    super(`${date} is not a valid date`, InvalidDateException);
  }
}
