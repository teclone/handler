import { DateConverter } from './@types/index';
import InvalidDateException from './Exceptions/InvalidDateException';
import CustomDate from './CustomDate';

export const dateConverter: DateConverter = (value: string) => {
  const date = CustomDate.isValid(value);
  if (date === false) {
    throw new InvalidDateException(value);
  }
  return date;
};
