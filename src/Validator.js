/**
 * validation configuration options
 *@typedef {Object} ValidationOptions
 *@param {string} [hint] - error message to set if field is missing
 *@param {number|string} [min] - expected field value minimum length
 *@param {string} [minErr] - error message to set if min validation fails
 *@param {number|string} [max] - expected field value maximum length
 *@param {string} [maxErr] - error message to set if max validation fails
 *@param {number|string} [gt] - specifies that the field value must be greater than a given value
 *@param {string} [gtErr] - error message to set if gt validation fails
 *@param {number|string} [lt] - specifies that the field value must be less than a given value
 *@param {string} [ltErr] - error message to set if lt validation fails
*/

import CustomDate from './CustomDate';
import DirectoryNotFoundException from './Exceptions/DirectoryNotFoundException';
import FileMoveException from './Exceptions/FileMoveException';
import FilesSourceNotSetException from './Exceptions/FilesSourceNotSetException';
import InvalidDateException from './Exceptions/InvalidDateException';
import FileExtensionDetector from './FileExtensionDetector';
import Common from './Traits/Common';
import Util from './Util';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Validator module
*/
export default class Validator extends Common
{
    /**
     * returns support schemes for uri validation
     *
     *@protected
     *@returns {Array}
    */
    getURISchemes() {
        return [
            'http',
            'https',
            'ssh',
            'ftp',
            'smtp',
            'telnet',
            'imap',
            'ip',
            'ssl',
            'pop3',
            'sip',
            'ws',
            'wss'
        ];
    }

    /**
     * validate matchWith or matchAgainst rule option
     *
     *@protected
     *@param {mixed} value - reference value
     *@param {ValidationOptions} options - validation options
     *@param {string} prefix - error prefix to use
     *@returns {boolean}
    */
    matchWith(value, options, prefix) {
        prefix = Util.isString(prefix)? prefix : '{_this}';

        const matchWith = Util.objectValue(['matchWith', 'matchAgainst'], options),
            _value = Util.value('value', matchWith);

        if (_value !== undefined && value != _value)
            this.setError(
                Util.value('err', matchWith, prefix + ' did not match'),
                value
            );

        return this.succeeds();
    }

    /**
     * runs post validation
     *
     *@protected
     *@param {string} value - current value under validation
     *@param {Object} options - validation rule options
     *@param {string} [prefix] - error prefix to use
     *@returns {boolean}
    */
    postValidate(value, options, prefix) {
        if (this.succeeds())
            this.matchWith(value, options, prefix);

        return this.succeeds();
    }

    /**
     * checks the regexNone rule
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Array} regexes - array of regex test expression objects
     *@returns {boolean}
    */
    regexCheckNone(value, regexes) {
        if (regexes.length === 0)
            return true;

        for (let regex of regexes) {
            if (Util.isPlainObject(regex)) {
                const test = Util.value('test', regex);
                if (Util.isRegex(test) && test.test(value)) {
                    return this.setError(
                        Util.value('err', regex, '{this} format not acceptable or contains some unwanted characters'),
                        value
                    );
                }
            }
        }

        return true;
    }

    /**
     * checks the regexAny rule
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Object} regex - object containing the regex tests array
     *@param {Array} regex.tests - array containing regex test instances
     *@param {string} regex.err - error message to set if none of regex tests succeeds
     *@returns {boolean}
    */
    regexCheckAny(value, regex) {
        const tests = Util.arrayValue('tests', regex);
        if (tests.length === 0)
            return true;

        const succeeds = tests.some(test => {
            return Util.isRegex(test) && test.test(value);
        });

        if (!succeeds)
            return this.setError(
                Util.value('err', regex, '{this} did not meet any of the expected formats'),
                value
            );

        return true;
    }

    /**
     * checks the regexAll rule
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Array} regexes - array of regex test expression objects
     *@returns {boolean}
    */
    regexCheckAll(value, regexes) {
        if (regexes.length === 0)
            return true;

        for (let regex of regexes) {
            if (Util.isPlainObject(regex)) {
                const test = Util.value('test', regex);
                if (Util.isRegex(test) && !test.test(value)) {
                    return this.setError(
                        Util.value('err', regex, '{this} did not meet all expected formats'),
                        value
                    );
                }
            }
        }

        return true;
    }

    /**
     * checks the regex rule
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Object} regex - regex test expression object
     *@param {RegExp} [regex.test] - the regex pattern,
     *@param {string} [regex.err] - the error message to set if test fails
     *@returns {boolean}
    */
    regexCheck(value, regex) {
        const test = Util.value('test', regex);
        if (Util.isRegex(test) && !test.test(value)) {

            return this.setError(
                Util.value('err', regex, '{this} is not a valid value'),
                value
            );
        }

        return true;
    }

    /**
     * runs regex rule checks
     *
     *@protected
     *@param {string} value - the field value
     *@param {Array} options - field rule options
    */
    checkRegexRules(value, options) {
        //check for regex rule
        if (this.succeeds())
            this.regexCheck(value, Util.objectValue('regex', options));

        //check for regexAll rule
        if (this.succeeds())
            this.regexCheckAll(value, Util.arrayValue('regexAll', options));

        //check for regexAny rule
        if (this.succeeds())
            this.regexCheckAny(value, Util.objectValue('regexAny', options));

        //check for regexNone rule
        if (this.succeeds())
            this.regexCheckNone(value, Util.arrayValue('regexNone', options));

        return this.succeeds();
    }

    /**
     * construct limiting rule error
     *
     *@protected
     *@returns {string}
    */
    constructLimitingRuleErr(prefix, err, value, unit) {
        prefix += ' ';
        let formatter = new Intl.NumberFormat(),
            constructedErr = '',
            actualUnit = '';

        switch(unit)
        {
            case 'characters':
                constructedErr = prefix + err + ' ' + formatter.format(value) +
                    ' characters';
                break;
            case 'numeric':
                constructedErr = prefix + err + ' ' + formatter.format(value);
                break;
            case 'date':
                constructedErr = prefix + err + ' ' + value;
                break;
            case 'file':
                formatter = new Intl.NumberFormat(undefined, {maximumFractionDigits: 2});
                for (let [unit, size] of Object.entries(this._fileUnitSizes)) {
                    if (value >= size) {
                        actualUnit = unit;
                        value = value / size;
                        break;
                    }
                }
                constructedErr = prefix + err + ' ' + formatter.format(value) + actualUnit;
                break;
        }

        return constructedErr;
    }

    /**
     * runs the callback method on the given value
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Callable} callback - the callback method
     *@return {mixed}
    */
    runCallback(value, callback) {
        if (Util.isCallable(callback))
            return callback(value);

        return value;
    }

    /**
     * resolve limiting value. string values will be converted accurately
     *
     *@protected
     *@param {string} key - the rule key
     *@param {Object} options - the rule options object
     *@return {mixed}
    */
    resolveLimitingRuleValue(key, options) {
        const value = Util.value(key, options);
        if (Util.isString(value)) {
            const units = Object.keys(this._fileUnitSizes),
                regex = new RegExp(
                    '^(\\.[0-9]+|[0-9]+[.]?[0-9]*)(' + units.join('|') + ')$'
                );

            if (regex.exec(value)) {
                const number = parseFloat(RegExp.$1);
                return number * this._fileUnitSizes[RegExp.$2.toLowerCase()];
            }
        }
        return value;
    }

    /**
     * checks the limiting rules such as min, max, lt, gt
     *
     *@protected
     *@param {string} value - the value
     *@param {number|Date} actual - the actual value
     *@param {string} unit - the unit of measurement to use
     *@param {Callable} [callback=null] - a callback method
     *@param {string} [prefix] - a string prefix to use
     *@return {boolean}
    */
    checkLimitingRules(value, actual, unit, callback, prefix) {
        prefix = Util.isString(prefix)? prefix : '{_this}';
        const options = this._options;

        let err = '';

        //check the min limit
        let min = this.resolveLimitingRuleValue('min', options);
        if (min !== undefined) {
            min = this.runCallback(min, callback);
            if(actual < min) {
                err = this.constructLimitingRuleErr(
                    prefix,
                    'should not be less than',
                    min,
                    unit
                );
                return this.setError(Util.value('minErr', options, err), value);
            }
        }

        //check the max limit
        let max = this.resolveLimitingRuleValue('max', options);
        if (max !== undefined) {
            max = this.runCallback(max, callback);
            if(actual > max) {
                err = this.constructLimitingRuleErr(
                    prefix,
                    'should not be greater than',
                    max,
                    unit
                );
                return this.setError(Util.value('maxErr', options, err), value);
            }
        }

        //check the gt limit
        let gt = this.resolveLimitingRuleValue('gt', options);
        if (gt !== undefined) {
            gt = this.runCallback(gt, callback);
            if(actual <= gt) {
                err = this.constructLimitingRuleErr(
                    prefix,
                    'should be greater than',
                    gt,
                    unit
                );
                return this.setError(Util.value('gtErr', options, err), value);
            }
        }

        //check the lt limit
        let lt = this.resolveLimitingRuleValue('lt', options);
        if (lt !== undefined) {
            lt = this.runCallback(lt, callback);
            if(actual >= lt) {
                err = this.constructLimitingRuleErr(
                    prefix,
                    'should be less than',
                    lt,
                    unit
                );
                return this.setError(Util.value('ltErr', options, err), value);
            }
        }
        return this.succeeds();
    }

    /**
     * returns date format regex
     *
     *@protected
     *@return {RegExp}
    */
    getDateFormat() {
        return /^([0-9]{4})([-._:|/\s])?([0-9]{1,2})\2?([0-9]{1,2})$/;
    }

    /**
     * resolves the date parameter
     *
     *@protected
     *@return {CustomDate|null}
    */
    resolveDate(value) {
        if (Util.isString(value) && this.getDateFormat().test(value)) {
            const year = parseInt(RegExp.$1),
                month = parseInt(RegExp.$3) - 1,
                day = parseInt(RegExp.$4);

            if(CustomDate.isValid(year, month, day))
                return new CustomDate(year, month, day);
        }
        return null;
    }

    /**
     * resets the validator, and checks if the validation should proceed
     *
     *@protected
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@protected
     *@return {boolean}
    */
    setup(required, field, value, options, index) {
        this.reset(field, options, index);
        this._fileName = '';
        this._fileMagicByte = '';

        if (!required && (value === '' || value === null || value === undefined)) {
            this.shouldProceed(false);
        }
        else if (value === null || value === '' || value === undefined) {
            this.shouldProceed(false);
            this.setError('{_this} is required', value);
        }
        else {
            this.shouldProceed(true);
        }

        return this.shouldProceed();
    }

    /**
     *@param {Object} files - the files object
     *@param {Object} errorBag - error bag to store errors
     *@param {FileExtensionDetector} [fileExtensionDetector=FileExtensionDetector] - a file extension detector instance
    */
    constructor(files, errorBag, fileExtensionDetector)
    {
        super(errorBag);

        /*
         * the file extension detector instance
        */
        this._fileExtensionDetector = null;

        /*
         * the files object
        */
        this._files = null;

        this._fileName = '';

        this._fileMagicByte = '';

        /*
         * all file unit sizes
        */
        this._fileUnitSizes = {
            tb: 1000000000000,
            gb: 1000000000,
            mb: 1000000,
            kb: 1000,
            bytes: 1
        };

        if (!(fileExtensionDetector instanceof FileExtensionDetector))
            fileExtensionDetector = new FileExtensionDetector();

        this.setFileExtensionDetector(fileExtensionDetector);
        this.setFiles(files);
    }

    /**
     * sets the file extension detector
     *
     *@param {FileExtensionDetector} fileExtensionDetector - the instance
     *@return {this}
    */
    setFileExtensionDetector(fileExtensionDetector) {
        if (fileExtensionDetector instanceof FileExtensionDetector)
            this._fileExtensionDetector = fileExtensionDetector;

        return this;
    }

    /**
     * sets the files object
     *@param {Object} files - the files object
     *@return {this}
    */
    setFiles(files) {
        if (Util.isPlainObject(files))
            this._files = files;

        return this;
    }

    /**
     * returns the computed file name for the last file validation that involved a moveTo
     * operation. Returns empty string if there is non
     *
     *@return {string}
    */
    getFileName() {
        return this._fileName;
    }

    /**
     * returns the magic byte for the last file validation
     *
     *@return {string}
    */
    getFileMagicByte() {
        return this._fileMagicByte;
    }

    /**
     * validates text
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@return {boolean}
    */
    validateText(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();

            const len = value.length;
            this.checkLimitingRules(value, len, 'characters');

            //check for formatting rules
            this.checkRegexRules(value, options);
        }

        return this.postValidate(value, options);
    }

    /**
     * validates date
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateDate(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();

            //if date is not in good format, return immediately
            if (!this.getDateFormat().test(value))
                return this.setError(
                    Util.value('formatErr', options, '{this} is not a valid date format'),
                    value
                );

            //if date is not valid, return immediately
            let date = this.resolveDate(value);
            if (date === null)
                return this.setError(
                    Util.value('err', options, '{this} is not a valid date'),
                    value
                );

            //validate the limiting rules
            this.checkLimitingRules(value, date, 'date', (value) => {
                let date = this.resolveDate(value);
                if (date === null)
                    throw new InvalidDateException(value + ' is not a valid date');

                return date;
            });
        }
        return this.postValidate(value, options);
    }

    /**
     * validates integers
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateInteger(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();

            if (/^[-+]?\d+$/.test(value))
                this.checkLimitingRules(value, parseInt(value), 'numeric');
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid integer'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates positive integers
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validatePInteger(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            if (/^[+]?\d+$/.test(value))
                this.checkLimitingRules(value, parseInt(value), 'numeric'); //check limiting rules
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid positive integer'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates negative integers
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateNInteger(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            if (/^-\d+$/.test(value))
                this.checkLimitingRules(value, parseInt(value), 'numeric'); //check limiting rules
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid negative integer'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates floats
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateFloat(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            if (/^(?:[-+]?\d+(\.\d+)?|\.\d+)$/.test(value))
                this.checkLimitingRules(value, parseFloat(value), 'numeric'); //check limiting rules
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid number'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates positive floats
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validatePFloat(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            if (/^(?:\+?\d+(\.\d+)?|\.\d+)$/.test(value))
                this.checkLimitingRules(value, parseFloat(value), 'numeric'); //check limiting rules
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid positive number'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates negative floats
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateNFloat(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            if (/^[-]\d+(\.\d+)?$/.test(value))
                this.checkLimitingRules(value, parseFloat(value), 'numeric'); //check limiting rules
            else
                this.setError(
                    Util.value('err', options, '{this} is not a valid negative number'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates email
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateEmail(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            /*
             * email validation https://www.w3resource.com/javascript/form/email-validation.php
             * https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
            */
            const err = Util.value('err', options, '{this} is not a valid email address'),
                rules = {
                    regexAll: [
                        //email contains two parts, personal info and domain
                        {test: /^[-\w!#$%&'*+/=?^`{|}~.]{1,64}@[-a-z0-9.]{1,253}$/i, err},

                        //personal info must start with a word character
                        {test: /^\w/, err},
                        /*
                         * domain consists of labels that are each 63 characters max, each label
                         * cannot start or end with highen
                        */
                        {
                            test: new RegExp(
                                '@[a-z0-9](?:[-a-z0-9]*[a-z0-9])?' //match first label
                                +
                                '(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*' // followed by one or more labels
                                +
                                '(\\.[a-z]{2,4})$' //then must have a top level domain
                                ,
                                'i'
                            ),
                            err
                        }
                    ],
                    regexNone: [
                        //in the personal info, there cant be two or more adjacent dots
                        {test: /\.{2,}.*@/, err},
                    ]
                };

            if (this.checkRegexRules(value, rules) && this.checkRegexRules(value, options)) {
                const len = value.length;
                this.checkLimitingRules(value, len, 'characters');
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates url
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateURL(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            const err = Util.value('err', options, '{this} is not a valid url'),
                schemes = Util.arrayValue('schemes', options, this.getURISchemes()),
                rules = {
                    /*
                     * domain consists of optional scheme, and consists of labels that are each
                     * 63 characters max, each label cannot start or end with highen
                    */
                    regex: {
                        test: new RegExp(
                            '^(?:(?:' + schemes.join('|') + ')://)?' //match optional scheme
                            +
                            '[a-z0-9](?:[-a-z0-9]*[a-z0-9])?' //match first label
                            +
                            '(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*' // followed by one or more labels
                            +
                            '(\\.[a-z]{2,4})' //then must have a top level domain
                            +
                            '(?:\\:\\d{1,4})?' //match optional port number
                            +
                            '(?:[#/?][-\\w()/#~:.?+=&%@]*)?$' //match optional part, hash, query
                            ,
                            'i'
                        ),
                        err
                    },
                };

            if (this.checkRegexRules(value, rules) && this.checkRegexRules(value, options)) {
                const len = value.length;
                this.checkLimitingRules(value, len, 'characters');
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates choice
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateChoice(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            const choices = Util.arrayValue('choices', options);

            const exists = choices.some(_value => {
                return _value == value;
            });

            if (!exists)
                this.setError(
                    Util.value('err', options, '{this} is not an acceptable choice'),
                    value
                );
        }
        return this.postValidate(value, options);
    }

    /**
     * validates range of options, either numbers or alphabets with optional step increment
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validateRange(required, field, value, options, index) {
        const from = Util.value('from', options),
            to = Util.value('to', options),
            step = Util.value('step', options, 1); //default step of 1

        options.choices = Util.range(from, to, Math.abs(step));
        return this.validateChoice(required, field, value, options, index);
    }

    /**
     * validate password
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    validatePassword(required, field, value, options, index) {
        options['min'] = Util.value('min', options, 8);
        options['max'] = Util.value('max', options, 28);

        options['regexAll'] = Util.arrayValue('regexAll', options, [
            //password should contain at least two alphabets
            {
                'test': /[a-z].*[a-z]/i,
                'err': 'Password must contain at least two letter alphabets'
            },
            //password should contain at least two non letter alphabets
            {
                'test': /[^a-z].*[^a-z]/i,
                'err': 'Password must contain at least two non letter alphabets'
            }
        ]);

        if (this.setup(required, field, value, options, index)) {
            value = value.toString();

            //validate the limiting rules
            this.checkLimitingRules(value, value.length, 'characters', null, 'Password');

            //check for regex rules
            this.checkRegexRules(value, options);
        }

        return this.postValidate(value, options, 'Passwords');
    }

    /**
     * validates file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateFile(required, field, value, options, index) {
        if (this._files === null)
            throw new FilesSourceNotSetException('no file source set');

        if (this.setup(required, field, value, options, index)) {
            value = value.toString();
            this._fileName = value;

            const files = this._files[field];
            Object.keys(files).forEach(key => {
                files[key] = Util.makeArray(files[key]);
            });

            index = this._index;

            //validate limiting rules
            if (!this.checkLimitingRules(value, files.size[index], 'file'))
                return this.postValidate(value, options);

            //test file extension
            let ext = '';

            const tempFileLocation = files.path[index],
                exts = this._fileExtensionDetector.detect(tempFileLocation);

            this._fileMagicByte = this._fileExtensionDetector.getMagicByte();
            if (exts.includes('txt')) {
                ext = 'txt';
            }
            else if (/\.(\w+)$/.test(value)) {
                ext = this._fileExtensionDetector.resolveExtension(RegExp.$1);
                if (!exts.includes(ext))
                    return this.setError('File extension spoofing detected', value);
            }
            else {
                ext = exts[0];
            }

            //validate mimes
            const mimes = this._fileExtensionDetector.resolveExtensions(
                Util.arrayValue('mimes', options)
            );
            if (mimes.length > 0 && !mimes.includes(ext))
                return this.setError(
                    Util.value('mimeErr', options, `".${ext}" file extension not accepted`)
                );

            // override file extension mime if given
            ext = Util.value('overrideMime', options, ext);

            //move file to some other location if moveTo option is set
            let moveTo = Util.value('moveTo', options, '');
            if (moveTo !== '') {
                if(!fs.existsSync(moveTo))
                    throw new DirectoryNotFoundException(moveTo + ' moveTo folder does not exist');

                const fileName = crypto.randomBytes(16).toString('hex') + '.' + ext;
                moveTo = path.join(moveTo, fileName);

                try {
                    fs.renameSync(tempFileLocation, moveTo);
                    this._fileName = fileName;
                }
                catch(ex) {
                    throw new FileMoveException(
                        Util.value('moveErr', options, 'Error occured while moving uploaded file')
                    );
                }
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates image file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateImage(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getImageMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates audio file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateAudio(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getAudioMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates video file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateVideo(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getVideoMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates media file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateMedia(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getMediaMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates document file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateDocument(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getDocumentMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates archive file upload
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - file field name
     *@param {mixed} value - file field value
     *@param {ValidationOptions} options - validation options
     *@param {number} index - current field value index
     *@throws {DirectoryNotFoundException}
     *@throws {FileMoveException}
    */
    validateArchive(required, field, value, options, index) {
        options['mimes'] = Util.arrayValue(
            'mimes',
            options,
            this._fileExtensionDetector.getArchiveMimes()
        );
        return this.validateFile(required, field, value, options, index);
    }
}