import BaseRule from './BaseRule';
import { Regex } from '..';
import { NumberOptions } from './NumberRules';

export interface TextOptions extends NumberOptions {
  /**
   * defines regex pattern that field value(s) must match
   */
  regex?: Regex;

  /**
   * array of regex patterns that field value(s) must match
   */
  regexAll?: Regex[];

  /**
   * defines array of regex patterns that field value(s) must match at least one of, to be
   * considered a success
   */
  regexAny?: {
    /**
     * array of regex patterns
     */
    patterns: RegExp[];
    /**
     * optional error message if field value(s) did not match at least one of the patterns
     */
    err?: string;
  };

  /**
   * defines regex or array of regex patterns that the field value(s) must not match.
   */
  regexNone?: Regex | Regex[];
}

export interface URLOptions extends TextOptions {
  /**
   * defines accepted uri schemes or protocols. case insensitive
   */
  schemes?: string | string[];

  /**
   * boolean value indicating if url must have the scheme section to be considered valid.
   * default to false
   */
  mustHaveScheme?: boolean;
}

export interface PasswordOptions extends TextOptions {
  /**
   * boolean value indicating if the default internal password pre-validations should be
   * applied. default value is true. the default password pre-validation checks that the
   * password is at least 8 characters long and at max 26 characters long, and that it contains at least two letter alphabets
   * and that it contains at least two non-letter characters.
   *
   * set to false if you don't want the default internal password validations to be applied at all
   */
  preValidate?: boolean;
}

export interface PhoneNumberOptions extends TextOptions {
  /**
   * if given, the phone number is validated against this country.
   */
  country?: string;

  /**
   * boolean indicating if non-geographical numbers should not be accepted. defaults to true.
   */
  enforceCountry?: boolean;
}

declare interface BaseTextRule<F extends string> extends BaseRule<F> {
  /**
   * defines text related field type validation options, such as text, email, password and url
   */
  options?: TextOptions;
}

//text rules
declare interface TextRule<F extends string> extends BaseTextRule<F> {
  type?: 'text';
}

declare interface EmailRule<F extends string> extends BaseTextRule<F> {
  type: 'email';
}

declare interface URLRule<F extends string> extends BaseTextRule<F> {
  type: 'url';
  /**
   * defines url field type validation options
   */
  options?: URLOptions;
}

declare interface PasswordRule<F extends string> extends BaseTextRule<F> {
  type: 'password';
  /**
   * defines password field type validation options
   */
  options?: PasswordOptions;
}

declare interface PhoneNumberRule<F extends string> extends BaseTextRule<F> {
  type: 'phoneNumber';
  /**
   * defines phoneNumber type validation options
   */
  options?: PhoneNumberOptions;
}
