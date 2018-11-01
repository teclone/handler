import Util from './Util';
import Regex from './Regex';
import Validator from './Validator';
import CustomDate from './CustomDate';
import DataSourceNotSetException from './Exceptions/DataSourceNotSetException';
import RulesNotSetException from './Exceptions/RulesNotSetException';
import FilesSourceNotSetException from './Exceptions/FilesSourceNotSetException';
import StateException from './Exceptions/StateException';
import KeyNotFoundException from './Exceptions/KeyNotFoundException';
import InvalidParameterException from './Exceptions/InvalidParameterException';

export default class {

    /**
     * returns rule type to validation method map
     *
     *@return {Object}
    */
    getRuleTypesMethodMap()
    {
        return {
            //text validator
            'text': 'validateText',

            // date validator
            'date': 'validateDate',

            //integer validation methods
            'int': 'validateInteger',
            'pint': 'validatePInteger',
            'nint': 'validateNInteger',

            //number validation methods
            'float': 'validateFloat',
            'pfloat': 'validatePFloat',
            'nfloat': 'validateNFloat',

            //boolean validation
            'bool': '',

            //email validation
            'email': 'validateEmail',

            //url validation
            'url': 'validateURL',

            //choice validation
            'choice': 'validateChoice',

            //range validation
            'range': 'validateRange',

            //file validation
            'file': 'validateFile',

            //image file validation
            'image': 'validateImage',

            //audio file validation
            'audio': 'validateAudio',

            //video file validation
            'video': 'validateVideo',

            //media file validation
            'media': 'validateMedia',

            //document file validation
            'document': 'validateDocument',

            'archive': 'validateArchive',

            //password validation
            'password': 'validatePassword'
        };
    }

    /**
     * sets error message for a given field
     *
     *@protected
     *@param {string} field - the field
     *@param {string} err - the error message
     *@return {this}
    */
    setError(field, err) {
        this._errors[field] = err;
        return this;
    }

    /**
     * sets the given data
     *
     *@protected
     *@param {string} field - the field name
     *@param {string} value - the field value
     *@returns {this}
    */
    setData(field, value) {
        this._data[field] = value;
        return this;
    }

    /**
     * tests if a value is falsy
     *
     *@param $value - the value to test
     *@returns {boolean}
    */
    valueIsFalsy(value) {
        return value === '' || /(false|off|0|nil|null|no|undefined)/i.test(value);
    }

    /**
     * runs validation on the given field whose value is the given value
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field to validate
     *@param {mixed} value - field value
     *@param {Array} options - the rule options
     *@param {number} index - the value index position
     *@return {boolean}
    */
    runValidation(required, field, value, options, index)
    {
        const validator = this._validator,
            type = options.type,
            method = Util.value(type, this.getRuleTypesMethodMap(), 'null');

        if(method === 'null') {
            throw new InvalidParameterException(type + ' is not a recognised rule type');
        }

        if (method !== '') {
            validator[method](required, field, value, options, index);
            if(this.isFileField(field)) {
                const newFileName = validator.getFileName();
                if (Util.isArray(this._data[field]))
                    this._data[field].push(newFileName);
                else
                    this._data[field] = newFileName;
            }
        }

        return validator.succeeds();
    }

    /**
     * validate the fields
     *
     *@param {array} fields - the array of fields to validate
     *@param {boolean} required - boolean value indicating if field is required
    */
    validateFields(fields, required) {
        fields.forEach(field => {
            const rules = this._ruleOptions[field],
                values = Util.makeArray(this._data[field]);

            let len = values.length,
                i = -1;
            while(++i < len && this.runValidation(required, field, values[i], rules, i));
        });
    }

    /**
     * strips html tags out of the text value
     *@protected
     *@param {string} value - value to remove html tags from
     *@param {}
    */
    stripTags(value, stripTagsIgnore) {
        stripTagsIgnore = Util.isString(stripTagsIgnore)? stripTagsIgnore.toLowerCase() : '';

        return Regex.replaceCallback(/<\s*\/?([_a-z][-\w]*)\s*>/, (matches) => {
            let capture = '<' + matches[1] + '>';
            if (stripTagsIgnore.indexOf(capture.toLowerCase()))
                return capture;

            return '';
        }, value);
    }

    /**
     * runs filters on the given value, using the specified filters
     *
     *@protected
     *@param {mixed} value - the value
     *@param {Object} filters - object of filters to apply
     *@returns {mixed}
    */
    filterValue(value, filters) {
        if (Util.isArray(value)) {
            return value.map(_value => {
                return this.filterValue(_value, filters);
            });
        }

        if (value === null || value === undefined)
            return value;

        value = value.toString();
        if (Util.keyNotSetOrTrue('decode', filters))
            value = decodeURIComponent(value);

        if (Util.keyNotSetOrTrue('trim', filters))
            value = value.trim();

        if (Util.keyNotSetOrTrue('stripTags', filters))
            value = this.stripTags(value, Util.value('stripTagsIgnore', filters, ''));

        if (Util.keySetAndTrue('numeric', filters))
            value = parseFloat(value);

        if (Util.keySetAndTrue('toUpper', filters))
            value = value.toUpperCase();

        else if (Util.keySetAndTrue('toLower', filters))
            value = value.toLowerCase();

        switch(filters.type)
        {
            case 'email':
                value = Regex.replace(/[^-\w!#$%&'*+/=?^`{|}~.@]/, '', value);
                break;

            case 'url':
                value =  Regex.replace(/[^-\w!#$%&'*+/=?^`:?{|}()~.@]/, '', value);
                break;

            case 'int':
            case 'pint':
            case 'nint':
                if (Util.isNumeric(value))
                    value = parseInt(value);
                break;

            case 'float':
            case 'pfloat':
            case 'nfloat':
                if (Util.isNumeric(value))
                    value = parseFloat(value);
                break;

            case 'bool':
                if (this.valueIsFalsy(value))
                    value = false;
                else
                    value = true;
                break;
        }
        return value;
    }

    /**
     * returns true if the given type is a file type
     *
     *@protected
     *@param {string} type - the type
     *@return {boolean}
    */
    isFileType(type) {
        switch(type) {
            case 'file':
            case 'image':
            case 'audio':
            case 'video':
            case 'media':
            case 'archive':
                return true;
            default:
                return false;
        }
    }

    /**
     * returns true if the field type is a file type
     *
     *@protected
     *@param {string} field - the field
     *@return {boolean}
    */
    isFileField(field) {
        return this.isFileType(this._ruleOptions[field]['type']);
    }

    /**
     * checks if the given field is missing
     *
     *@protected
     *@return {boolean}
    */
    fieldIsMissing(field) {
        const isFileField = this.isFileField(field);

        let target = null;
        if (isFileField) {
            if (typeof this._files[field] === 'undefined')
                this._files[field] = {};

            target = Util.value('name', this._files[field]);
        }
        else {
            target = Util.value(field, this._source);
        }

        let isMissing = true;
        if (target !== undefined && target !== '') {
            isMissing = false;

            //if the target value happens to be an array, then lets check if the array is empty
            if (Util.isArray(target)) {
                const filters = target.filter(value => {
                    return value !== '' && value !== undefined && value !== null;
                });

                if (isFileField)
                    this._files[field].name = filters;
                else
                    this._source[field] = filters;

                //finally, if our filters is empty, then the field is missing
                if (filters.length === 0)
                    isMissing = true;
            }
        }

        return isMissing;
    }

    /**
     * runs the get field call
     *
     *@protected
     *@param {Array} fields - array of fields
    */
    runGetFields(fields) {
        fields.forEach(field => {
            let value = null;

            if (this.isFileField(field))
                value = Util.value('name', this._files, null);
            else
                value = this._source[field];

            const filters = this._filters[field];
            this.setData(field, this.filterValue(value, filters));
        });
    }

    /**
     * gets the fields
     *@protected
    */
    getFields() {
        //get required fields
        this.runGetFields(this._requiredFields);

        //resolve default values
        this.resolveOptions(this._defaultValues);

        //use default value for optional fields that are missing
        this._optionalFields.forEach(field => {
            if (this.fieldIsMissing(field) && !this.isFileField(field))
                this._source[field] = this._defaultValues[field];
        });

        //get optional fields
        this.runGetFields(this._optionalFields);
    }

    /**
     * checks for missing fields
     *
     *@protected
     *@return {boolean}
    */
    checkMissingFields() {
        this._requiredFields.forEach((field) => {
            if (this.fieldIsMissing(field))
                this.setError(field, this._hints[field]);
        });
        return this.succeeds();
    }

    /**
     * resolves option
     *
     *@protected
     *@param {string} field - the field key
     *@param {Object|string} option - the option to resolve
    */
    resolveOption(field, option) {
        if (Util.isPlainObject(option)) {
            for (let [key, value] of Object.entries(option))
                option[key] = this.resolveOption(field, value);

            return option;
        }

        if (Util.isArray(option)) {
            return option.map((value) => {
                return this.resolveOption(field, value);
            });
        }

        return Regex.replaceCallback(/\{\s*([^}]+)\s*\}/, (matches) => {
            const capture = matches[1];
            switch(capture.toLowerCase()) {
                case '_this':
                    return field;

                case 'current_datetime':
                case 'current_date':
                    return '' + new CustomDate();

                case 'current_year':
                    return (new CustomDate()).getFullYear();

                case 'current_timestamp':
                case 'current_time':
                    return (new CustomDate()).getTime() * 1000;

                default:
                    return Util.value(capture, this._data, matches[0]);
            }
        }, option);
    }

    /**
     * resolves options.
     *
     *@protected
     *@param {Object} options - the options to resolve
     *@returns {Object}
    */
    resolveOptions(options) {
        for (let [field, option] of Object.entries(options))
            options[field] = this.resolveOption(field, option);

        return options;
    }

    /**
     * resolve db checks 'check' rule, replace all doesnot, doesnt with not, replace exists
     * with exist
     *
     *@protected
     *@param {Object} dbCheck - the database check detail
     *@return {Object}
    */
    resolveDBChecks(dbCheck) {
        const condition = Util.value(['if', 'condition'], dbCheck);
        if (condition !== undefined) {
            dbCheck['if'] = Regex.replace(
                [
                    /(doesnot|doesnt)/,
                    /exists/
                ],
                [
                    'not',
                    'exist'
                ],
                condition.toLowerCase()
            );
        }
        return dbCheck;
    }

    /**
     * resolves the rule type
     *
     *@protected
     *@param {string} - the rule type
     *@return {string}
    */
    resolveType(type) {
        return Regex.replace([
            /integer/,
            /positive/,
            /negative/,
            /(number|money)/,
            /boolean/,
            /string/
        ], [
            'int',
            'p',
            'n',
            'float',
            'bool',
            'text'
        ], type.toLowerCase());
    }

    /**
     * processes the rules, extracting the portions as the need be
     *@protected
    */
    processRules() {
        for (let [field, rule] of Object.entries(this._rules)) {
            const type = this.resolveType(Util.value('type', rule, 'text')),
                dbChecks = Util.arrayValue('checks', rule);

            if (typeof rule.check !== 'undefined')
                dbChecks.unshift(rule.check);

            this._dbChecks[field] = dbChecks.map(this.resolveDBChecks);
            this._filters[field] = Util.objectValue('filters', rule);
            this._ruleOptions[field] = Util.objectValue('options', rule);

            this._ruleOptions[field]['type'] = this._filters[field]['type'] = type;

            let requireIf = Util.objectValue(['requiredIf', 'requireIf'], rule),
                condition = Util.value(['if', 'condition'], requireIf, '');

            if (condition !== '') {
                let required = false,
                    _field = Util.value('field', requireIf, ''),
                    _value = Util.value('value', requireIf, ''),
                    _fieldValue = Util.value(_field, this._source);

                switch(condition.toLowerCase()) {

                    case 'checked':
                        if (!this.valueIsFalsy(_fieldValue))
                            required = true;
                        break;

                    case 'notchecked':
                        if (this.valueIsFalsy(_fieldValue))
                            required = true;
                        break;

                    case 'equals':
                    case 'equal':
                        if (_value == _fieldValue)
                            required = true;
                        break;

                    case 'notequals':
                    case 'notequal':
                        if (_value != _fieldValue)
                            required = true;
                        break;
                }
                rule.required = required;
            }
            Util.deleteFromObject(['requiredIf', 'requireIf'], rule);

            if(Util.keyNotSetOrTrue('required', rule) && type !== 'bool') {
                this._requiredFields.push(field);
                this._hints[field] = Util.value('hint', rule, `${field} is required`);
            }
            else {
                this._optionalFields.push(field);
                this._defaultValues[field] = Util.value(['default', 'defaultValue'], rule, null);
            }
        }
    }

    /**
     * merges the fields and the added field
     *@protected
    */
    mergeSource() {
        this._source = {...this._source, ...this._addedFields};
    }

    /**
     * returns boolean indicating if the execute call should proceed
     *@protected
     *@return {boolean}
     *@throws {DataSourceNotSetException}
     *@throws {RulesNotSetException}
    */
    shouldExecute() {
        if (!this._executed) {
            if (this._source === null)
                throw new DataSourceNotSetException('no data source set');

            if (this._rules === null)
                throw new RulesNotSetException('no validation rules set');

            //if there is a file field, and the user did not set the files object, throw
            if (this._files === null) {
                const someFileFieldsExists = Object.keys(this._rules).some(field => {
                    const type = Util.value('type', this._rules[field], 'text').toLowerCase();
                    return this.isFileType(type);
                });

                if (someFileFieldsExists)
                    throw new FilesSourceNotSetException('no file source set');
            }

            return true;
        }
        return false;
    }

    /**
     *@param {Object} [source] - the data source
     *@param {Object} [files] - the files source
     *@param {Object} [rules] - the data rules
     *@param {Validator} [validator] - the validator instance
    */
    constructor(source, files, rules, validator) {
        /* the raw data to be handled and processed */
        this._source = null;

        /** the raw files to be handled and processed */
        this._files = null;

        /* object of added fields */
        this._addedFields = {};

        /* object of rules to apply */
        this._rules = null;

        /* the validator instance */
        this._validator = null;

        /* boolean value indicating if the execute method has been called */
        this._executed = false;

        /* array of required fields */
        this._requiredFields = [];

        /* array of optional fields */
        this._optionalFields = [];

        /* error hints for required fields */
        this._hints = {};

        /* object of default values for optional fields */
        this._defaultValues = {};

        /* object of filters for the fields */
        this._filters = {};

        /* object of rule options for the fields */
        this._ruleOptions = {};

        /* object of db checks to apply on each field */
        this._dbChecks = {};

        /* object containing found errors */
        this._errors = {};

        /* object of processed array of processed data */
        this._data = {};

        /* array of fields to skip while mapping data to model */
        this._modelSkipFields = [];

        /* object of field new names to use when mapping field data to model */
        this._modelRenameFields = {};

        /* boolean value indicating if model field names should be camelized */
        this.modelCamelizeFields = false;

        if (!(validator instanceof Validator))
            validator = new Validator();

        this.setSource(source).setFiles(files).setRules(rules).setValidator(validator);
    }

    /**
     * sets the source object
     *
     *@param {Object} source - the source object
     *@return {this}
    */
    setSource(source) {
        if (Util.isPlainObject(source))
            this._source = source;

        return this;
    }

    /**
     * sets the files object
     *
     *@param {Object} files - the files object
     *@return {this}
    */
    setFiles(files) {
        if (Util.isPlainObject(files))
            this._files = files;

        return this;
    }

    /**
     * sets the rules
     *
     *@param {Object} rules - the rules object
     *@return {this}
    */
    setRules(rules) {
        if (Util.isPlainObject(rules))
            this._rules = rules;

        return this;
    }

    /**
     * sets the validator instance
     *@param {Validator} validator
     *@return {this}
    */
    setValidator(validator) {
        if (validator instanceof Validator) {
            validator.setErrorBag(this._errors);
            this._validator = validator;
        }

        return this;
    }

    /**
     * adds field to the existing source
     *
     *@param {string} fieldName - the field name
     *@param {mixed} value - the field value
     *@return {this}
    */
    addField(fieldName, value) {
        if (Util.isString(fieldName))
            this._addedFields[fieldName] = value;

        return this;
    }

    /**
     * adds one or more fields to the existing source
     *
     *@param {object} fields - object of field name value pairs
     *@return {this}
    */
    addFields(fields) {
        if (Util.isPlainObject(fields)) {
            for (let [fieldName, value] of Object.entries(fields))
                this.addField(fieldName, value);
        }

        return this;
    }

    /**
     * executes the handler
     *@returns {boolean}
     *@throws {DataSourceNotSetException}
     *@throws {RulesNotSetException}
    */
    execute() {
        if (this.shouldExecute()) {
            this._executed = true;

            this.mergeSource();
            this.processRules();

            this.resolveOptions(this._hints);
            if (this.checkMissingFields())
            {
                this.getFields();

                this.resolveOptions(this._ruleOptions);
                this.resolveOptions(this._dbChecks);

                this._validator.setFiles(this._files);
                this.validateFields(this._requiredFields, true);
                this.validateFields(this._optionalFields, false);

                // if (this.succeeds())
                // {
                //     this.validateDBChecks(this._requiredFields, true);
                //     this.validateDBChecks(this._optionalFields, false);
                // }
            }
        }
        return this.succeeds();
    }

    /**
     * returns boolean indicating if data validation and handling processes succeeded
     *@return {boolean}
     *@throws {StateException} - throws error if the execute method has not been called
    */
    succeeds() {
        if(!this._executed)
            throw new StateException('Cant check state because execute method has not been called');

        return Object.keys(this._errors).length === 0;
    }

    /**
     * returns boolean indicating if data validation and handling processes failed
     *@return {boolean}
     *@throws {StateException} - throws error if the execute method has not been called
    */
    fails() {
        return !this.succeeds();
    }

    /**
     * returns the error message for the given key, if key is not given, it returns any
     * error message in the error bag
     *
     * it returns undefined if there are no errors or if there is no error for the given key.
     *@param {string} [field] - the field to return its error message
     *@returns {string|undefined}
    */
    getError(field) {
        const errorKeys = Object.keys(this._errors);
        if (errorKeys.length > 0) {
            //if the field is given, return the value else, return undefined
            if (typeof field === 'string')
                return Util.value(field, this._errors);

            //return the first error
            return this._errors[errorKeys[0]];
        }
        return undefined;
    }

    /**
     * returns the data for the given key if it exists, or null
     *
     *@param {string} key - the field key
     *@return {string|null}
     *@throws {KeyNotFoundException}
    */
    getData(key) {
        if (typeof this._data[key] !== 'undefined')
            return this._data[key];

        throw new KeyNotFoundException('the given key: ' + key + ' is not set');
    }

    /**
     * maps data to the given model object
     *@param {Object} model - the model object
     *@return {Object}
    */
    mapDataToModel(model) {
        model = Util.isObject(model)? model : {};

        for(let [key, value] of Object.entries(this._data)) {
            if (this._modelSkipFields.includes(key))
                continue; //skip field it is should be skipped

            key = Util.value(key, this._modelRenameFields, key);
            model = Util.composeIntoObject(model, key, value);
        }
        return model;
    }
}