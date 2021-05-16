import { padLeft, isString } from '@teclone/utils';
import { DATE_FORMAT } from './Constants';

export class CustomDate extends Date {
  static isValid(date: string): CustomDate | false;

  static isValid(
    year: number,
    month?: number,
    day?: number
  ): CustomDate | false;

  /**
   * returns a custom date object if the given date params are valid, else it returns false
   *
   * @param yearOrDateString year parameter or date string
   * @param month month parameter, default to first month
   * @param day day parameter, defaults to first day
   */
  static isValid(
    yearOrDateString: number | string,
    month: number = 0,
    day: number = 1
  ): CustomDate | false {
    let year: number = 0;
    if (isString(yearOrDateString) && !DATE_FORMAT.test(yearOrDateString)) {
      return false;
    }

    if (isString(yearOrDateString)) {
      year = parseInt(RegExp.$1);
      month = parseInt(RegExp.$3) - 1;
      day = parseInt(RegExp.$4);
    } else {
      year = yearOrDateString;
    }

    const d = new CustomDate(year, month, day);
    const isValid =
      d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;

    return isValid ? d : false;
  }

  toString(): string {
    return `${this.getFullYear()}-${padLeft(this.getMonth() + 1, 2)}-${padLeft(
      this.getDate(),
      2
    )}`;
  }

  currentTime() {
    return this.getTime() * 1000;
  }

  currentYear() {
    return this.getFullYear();
  }

  currentDate() {
    return `${this.getFullYear()}-${padLeft(this.getMonth() + 1, 2)}-${padLeft(
      this.getDate(),
      2
    )}`;
  }
}
