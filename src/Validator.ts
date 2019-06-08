import Common from './Common';
import { ErrorBag, FilesSource, Options, Unit, DateConverter } from './@types';
import CustomDate from './CustomDate';
import {
    isUndefined, expandToNumeric, convertToMemoryUnit, pickValue, makeArray,
    range, isString, isNull, isObject
} from '@forensic-js/utils';
import { DATE_FORMAT, URL_SCHEMES, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, DEFAULT_DOCUMENT_FILES, DEFAULT_ARCHIVE_FILES } from './Constants';
import { dateConverter } from './Util';
import { TextOptions, URLOptions, PasswordOptions } from './@types/rules/TextRules';
import { NumberOptions } from './@types/rules/NumberRules';
import { ChoiceOptions } from './@types/rules/ChoiceRule';
import { RangeOptions } from './@types/rules/RangeRule';
import { FileOptions } from './@types/rules/FilesRule';
import FileType, { FileTypeResult } from 'file-type';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import DirectoryNotFoundException from './Exceptions/DirectoryNotFoundException';
import FileMoveException from './Exceptions/FileMoveException';

export default class Validator extends Common {

    private files: FilesSource = {};

    private fileName: string = '';

    /**
     * gets the file type of the given file
     * @param filePath
     */
    private getFileType(filePath: string): Promise<FileTypeResult | null> {
        return new Promise(resolve => {
            fs.open(filePath, 'r', (err, fd) => {
                const buffer = Buffer.alloc(FileType.minimumBytes);
                fs.read(fd, buffer, 0, FileType.minimumBytes, null, (err, bytesRead, buffer) => {
                    fs.close(fd, (err) => {
                        resolve(FileType(buffer));
                    });
                });
            });
        });
    }

    /**
     * validate match against rule
     */
    private matchAgainst(value: string, options: Options, prefix: string) {
        const shouldMatch = options.shouldMatch;
        if (isObject(shouldMatch) && shouldMatch.target.toString() !== value) {
            this.setError(
                pickValue('err', shouldMatch, prefix + ' did not match'),
                value
            );
        }
    }

    /**
     * runs post validation
    */
    private postValidate(value: string, options: Options, prefix: string = '{_this}') {
        if (this.succeeds()) {
            this.matchAgainst(value, options, prefix);
        }
        return this.succeeds();
    }

    /**
     * validates regex check none rules
     */
    protected regexCheckNone(value: string, options: TextOptions) {
        if (this.succeeds() && options.regexNone) {
            const regexes = makeArray(options.regexNone);
            for (const regex of regexes) {
                if (regex.pattern.test(value)) {
                    this.setError(
                        pickValue('err', regex, '{this} is not a valid {_this}'),
                        value
                    );
                    break;
                }
            }
        }
        return this.succeeds();
    }

    /**
     * validates regex check any rules
     */
    protected regexCheckAny(value: string, options: TextOptions) {
        if (this.succeeds() && options.regexAny) {
            if (!options.regexAny.patterns.some((pattern) => pattern.test(value))) {
                this.setError(
                    pickValue('err', options.regexAny, '{this} is not a valid {_this}'),
                    value
                );
            }
        }
        return this.succeeds();
    }

    /**
     * validates regex check all rules
     */
    protected regexCheckAll(value: string, options: TextOptions) {
        if (this.succeeds() && options.regexAll) {
            for (const regex of options.regexAll) {
                if (!regex.pattern.test(value)) {
                    this.setError(
                        pickValue('err', regex, '{this} is not a valid {_this}'),
                        value
                    );
                    break;
                }
            }
        }
        return this.succeeds();
    }

    /**
     * check if value matches a pattern
    */
    protected regexCheck(value: string, options: TextOptions) {
        if (this.succeeds() && options.regex) {
            if (!options.regex.pattern.test(value)) {
                this.setError(
                    pickValue('err', options.regex, '{this} is not a valid {_this}'),
                    value
                );
            }
        }
        return this.succeeds();
    }

    /**
     * runs regex rule checks
    */
    protected checkRegexRules(value: string, options: Options) {
        //check for regex rule
        this.regexCheck(value, options);

        //check for regexAll rule
        this.regexCheckAll(value, options);

        //check for regexAny rule
        this.regexCheckAny(value, options);

        //check for regexNone rule
        this.regexCheckNone(value, options);

        return this.succeeds();
    }

    /**
     * constructs error message for limiting rule errors
     */
    protected constructLRErrorMessage(prefix: string, template: string,
        value: number | CustomDate, unit: Unit) {

        let formatter = new Intl.NumberFormat();
        let constructedMessage = '';

        prefix += ' ';

        switch(unit) {
            case 'character':
                constructedMessage = prefix + template + ' ' + formatter.format(value as number)
                    + ' characters';
                break;

            case 'number':
                constructedMessage = prefix + template + ' ' + formatter.format(value as number);
                break;

            case 'date':
                constructedMessage = prefix + template + ' ' + value;
                break;
            case 'file':
                constructedMessage = prefix + template + ' ' + convertToMemoryUnit(value as number);
                break;
        }

        return constructedMessage;
    }

    /**
     * checks the limiting rules such as min, max, lt, gt
    */
    protected checkLimitingRules(value: string, length: number | CustomDate, options: NumberOptions,
        unit: Unit, dateConverter?: DateConverter, prefix: string = '{_this}') {

        const resolveValue = (value: string | number) => {
            if(dateConverter) {
                return dateConverter(value.toString());
            }
            else {
                return expandToNumeric(value);
            }
        };

        let errorMessage = '';
        let template = '';

        //check the min limit
        if (!isUndefined(options.min)) {
            const min = resolveValue(options.min);
            template = 'should not be less than';
            if (length < min) {
                errorMessage = this.constructLRErrorMessage(prefix, template, min, unit);
                return this.setError(pickValue('minErr', options, errorMessage), value);
            }
        }

        //check the max limit
        if (!isUndefined(options.max)) {
            const max = resolveValue(options.max);
            template = 'should not be greater than';
            if (length > max) {
                errorMessage = this.constructLRErrorMessage(prefix, template, max, unit);
                return this.setError(pickValue('maxErr', options, errorMessage), value);
            }
        }

        //check the gt limit
        if (!isUndefined(options.gt)) {
            const gt = resolveValue(options.gt);
            template = 'should be greater than';
            if (length <= gt) {
                errorMessage = this.constructLRErrorMessage(prefix, template, gt, unit);
                return this.setError(pickValue('gtErr', options, errorMessage), value);
            }
        }

        //check the lt limit
        if (!isUndefined(options.lt)) {
            const lt = resolveValue(options.lt);
            template = 'should be less than';
            if (length >= lt) {
                errorMessage = this.constructLRErrorMessage(prefix, template, lt, unit);
                return this.setError(pickValue('ltErr', options, errorMessage), value);
            }
        }

        return this.succeeds();
    }

    protected setup(required: boolean, field: string, value: string, options: Options,
        index: number, isFile: boolean = false): boolean {

        this.reset(field, options, index);
        this.fileName = '';

        if (isFile) {
            if (typeof this.files[field] !== 'undefined') {
                return this.shouldProceed = true;
            }
            else {
                if (required) {
                    this.setError('{_this} is required', value);
                }
                return this.shouldProceed = false;
            }
        }
        else {
            if (value !== '') {
                return this.shouldProceed = true;
            }
            else {
                if (required) {
                    this.setError('{_this} is required', value);
                }
                return this.shouldProceed = false;
            }
        }
    }

    /**
     * sets the files source
     */
    setFiles(files: FilesSource) {
        this.files = files;
        return this;
    }

    /**
     * returns the computed file name for the last file validation that involved a moveTo
     * operation. Returns empty string if there is non
    */
    getFileName(): string {
        return this.fileName;
    }

    /**
     * validate text
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateText(required: boolean, field: string, value: string, options: TextOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            this.checkLimitingRules(value, value.length, options, 'character');

            //check for formatting rules
            this.checkRegexRules(value, options);
        }

        return this.postValidate(value, options);
    }

    /**
     * validate email address
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateEmail(required: boolean, field: string, value: string, options: TextOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            /*
             * email validation https://www.w3resource.com/javascript/form/email-validation.php
             * https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
            */
            const err = '{this} is not a valid email address';
            const internalOptions: TextOptions = {
                regexAll: [
                    //email must contain two parts; personal-info and domain part
                    {
                        pattern: /^[-\w!#$%&'*+/=?^`{|}~.]{1,64}@[-a-z0-9.]{1,253}$/i,
                        err
                    },
                    //personal info must start with a word character
                    {
                        pattern: /^\w/,
                        err
                    },
                    // domain consists of labels that are each 63 characters max, each label
                    // cannot start or end with highen
                    {
                        pattern: new RegExp(
                            '@[a-z0-9](?:[-a-z0-9]*[a-z0-9])?' //match first label
                            +
                            '(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*' //followed by one or more labels
                            +
                            '(\\.[a-z]{2,4})$' //then must have a top level domain
                            ,
                            'i'
                        ),
                        err
                    }
                ],
                //in the personal info, there cant be two or more adjacent dots
                regexNone: {
                    pattern: /\.{2,}.*@/,
                    err
                }
            };

            this.checkLimitingRules(value, value.length, options, 'character');

            this.checkRegexRules(value, internalOptions);
            this.checkRegexRules(value, options);
        }
        return this.postValidate(value, options);
    }

    /**
     * validate url
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateURL(required: boolean, field: string, value: string, options: URLOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            /*
             * email validation https://www.w3resource.com/javascript/form/email-validation.php
             * https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax
            */
            const schemes: string | string[] = pickValue('schemes', options, URL_SCHEMES);
            const err = '{this} is not a valid url';
            const internalOptions: URLOptions = {
                regex: {
                    /*
                     * domain consists of optional scheme, and consists of labels that are each
                     * 63 characters max, each label cannot start or end with highen
                    */
                    pattern: new RegExp(
                        //match optional scheme
                        '^(?:(?:' + schemes.join('|') + ')://)' + (options.mustHaveScheme? '' : '?')
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
                }
            };

            this.checkLimitingRules(value, value.length, options, 'character');

            this.checkRegexRules(value, internalOptions);
            this.checkRegexRules(value, options);
        }
        return this.postValidate(value, options);
    }

    /**
     * validate password
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validatePassword(required: boolean, field: string, value: string, options: PasswordOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            if (pickValue('preValidate', options, true)) {

                const internalOptions: PasswordOptions = {
                    min: MIN_PASSWORD_LENGTH,
                    max: MAX_PASSWORD_LENGTH,

                    regexAll: [
                        //password should contain at least two alphabets
                        {
                            pattern: /[a-z].*[a-z]/i,
                            err: 'Password must contain at least two letter alphabets'
                        },
                        //password should contain at least two non letter alphabets
                        {
                            pattern: /[^a-z].*[^a-z]/i,
                            err: 'Password must contain at least two non letter alphabets'
                        }
                    ]
                };

                this.checkLimitingRules(value, value.length, internalOptions, 'character', undefined, 'Password');
                this.checkRegexRules(value, internalOptions);
            }

            this.checkLimitingRules(value, value.length, options, 'character', undefined, 'Password');
            this.checkRegexRules(value, options);
        }

        return this.postValidate(value, options, 'Passwords');
    }

    /**
     * validates date
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateDate(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            if (!DATE_FORMAT.test(value)) {
                return this.setError('{this} is not a correct date format', value);
            }

            //if date is not valid, return immediately
            const date = CustomDate.isValid(value);
            if (date === false) {
                return this.setError('{this} is not a valid date', value);
            }

            //validate the limiting rules
            this.checkLimitingRules(value, date, options, 'date', dateConverter);
        }
        return this.postValidate(value, options);
    }

    /**
     * validates integer
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            if (/^[-+]?\d+$/.test(value)) {
                this.checkLimitingRules(value, parseInt(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid integer'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates positive integer
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validatePInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {
            if (/^[+]?\d+$/.test(value)) {
                this.checkLimitingRules(value, parseInt(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid positive integer'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates negative integer
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateNInt(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {
            if (/^-\d+$/.test(value)) {
                this.checkLimitingRules(value, parseInt(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid negative integer'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates floating point numbers
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {
            if (/^(?:[-+]?\d+(\.\d+)?|\.\d+)$/.test(value)) {
                this.checkLimitingRules(value, parseFloat(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid number'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates positive floating point numbers
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validatePNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {
            if (/^(?:[+]?\d+(\.\d+)?|\.\d+)$/.test(value)) {
                this.checkLimitingRules(value, parseFloat(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid positive number'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates negative floating point numbers
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateNNumber(required: boolean, field: string, value: string, options: NumberOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {
            if (/^(?:[-]\d+(\.\d+)?|\.\d+)$/.test(value)) {
                this.checkLimitingRules(value, parseFloat(value), options, 'number');
            }
            else {
                this.setError(
                    pickValue('err', options, '{this} is not a valid negative number'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates choice
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateChoice(required: boolean, field: string, value: string, options: ChoiceOptions,
        index: number): boolean {
        if (this.setup(required, field, value, options, index)) {

            const choices = options.choices as Array<string | number | boolean>;
            const exists = choices.some(current => current.toString() === value);

            if (!exists) {
                this.setError(
                    pickValue('err', options, '{this} is not an acceptable choice'),
                    value
                );
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates range
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
    */
    validateRange(required: boolean, field: string, value: string, options: RangeOptions,
        index: number): boolean {
        let choices: string[] | number[] = [];
        if (isString(options.from)) {
            choices = range(options.from, options.to as string, options.step);
        }
        else {
            choices = range(options.from, options.to as number, options.step);
        }

        const choiceOptions: ChoiceOptions = {choices};

        choiceOptions.shouldMatch = options.shouldMatch;
        choiceOptions.err = options.err;
        return this.validateChoice(required, field, value, choiceOptions, index);
    }

    /**
     * validates files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    async validateFile(required: boolean, field: string, value: string, options: FileOptions,
        index: number, category?: string | string[], label?: string): Promise<boolean> {
        if (this.setup(required, field, value, options, index, true)) {

            const file = this.files[field];
            value = makeArray(file.name)[index];
            this.fileName = value;

            //check limiting rules
            if (!this.checkLimitingRules(value, makeArray(file.size)[index], options, 'file')) {
                return false;
            }

            //check extensions and file category
            const exts = makeArray(options.exts as string).map(ext => ext.replace(/^\./, '').toLowerCase());
            const tempPath = makeArray(file.path)[index];
            category = makeArray(category as string);

            const fileType = await this.getFileType(tempPath);

            /* istanbul ignore if */
            if (isNull(fileType)) {
                return this.setError(
                    '{this} file extension could not be detected. Please check file',
                    value
                );
            }
            if (category.length > 0 && !category.includes(fileType.mime.split('/')[0]) ) {
                return this.setError(
                    pickValue('err', options, `{this} is not ${label} file`),
                    value
                );
            }
            if (exts.length > 0 && !exts.includes(fileType.ext)) {
                return this.setError(
                    pickValue('extErr', options, `.${fileType.ext} files are not allowed`),
                    value
                );
            }

            //move file to some location if given
            if (options.moveTo) {
                const destFolder = options.moveTo;
                if (fs.existsSync(destFolder) && fs.statSync(destFolder).isDirectory()) {
                    const fileName = crypto.randomBytes(32).toString('hex') + '.' + fileType.ext;
                    const dest = path.join(destFolder, fileName);
                    try {
                        fs.renameSync(tempPath, dest);
                        this.fileName = fileName;
                    }
                    catch (ex) {
                        throw new FileMoveException(ex.message);
                    }
                }
                else {
                    throw new DirectoryNotFoundException(
                        `${destFolder} moveTo path does not exist, or it is not a folder`
                    );
                }
            }
        }
        return this.postValidate(value, options);
    }

    /**
     * validates image files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateImage(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        return this.validateFile(required, field, value, options, index, 'image', 'an image');
    }

    /**
     * validates audio files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateAudio(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        return this.validateFile(required, field, value, options, index, 'audio', 'an audio');
    }

    /**
     * validates video files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateVideo(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        return this.validateFile(required, field, value, options, index, 'video', 'a video');
    }

    /**
     * validates media files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateMedia(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        return this.validateFile(
            required, field, value, options, index, ['image', 'video', 'video'], 'a media'
        );
    }

    /**
     * validates document files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateDocument(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        options.exts = pickValue('exts', options, DEFAULT_DOCUMENT_FILES);
        return this.validateFile(required, field, value, options, index);
    }

    /**
     * validates document files
     *
     * @param required boolean indicating if field is required
     * @param field field name under validation
     * @param value field value under validation
     * @param options validation options
     * @param index field value index position
     */
    validateArchive(required: boolean, field: string, value: string, options: FileOptions,
        index: number): Promise<boolean> {
        options.exts = pickValue('exts', options, DEFAULT_ARCHIVE_FILES);
        return this.validateFile(required, field, value, options, index);
    }
}