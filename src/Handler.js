import { DB_MODEL_CASE_STYLES, DB_MODELS } from './Constants';
import CustomDate from './CustomDate';
import DBChecker from './DBChecker';
import DataSourceNotSetException from './Exceptions/DataSourceNotSetException';
import FilesSourceNotSetException from './Exceptions/FilesSourceNotSetException';
import InvalidParameterException from './Exceptions/InvalidParameterException';
import KeyNotFoundException from './Exceptions/KeyNotFoundException';
import MissingParameterException from './Exceptions/MissingParameterException';
import RulesNotSetException from './Exceptions/RulesNotSetException';
import StateException from './Exceptions/StateException';
import Regex from './Regex';
import Util from './Util';
import Validator from './Validator';

export default class {

    /**
     * returns db checks rule to method map
     *@returns {Array}
    */
    getDBChecksMethodMap() {
        return {
            //check if exist method map
            'exist': 'checkIfExists',

            //check if not exists method map
            'notexist': 'checkIfNotExists',
        };
    }

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
            'checkbox': '',

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
     * calls the setData method on each data field in the object
     *
     *@protected
     *@param {Object} data - object of field: value data
     *@returns {this}
    */
    setDatas(data) {
        if (Util.isPlainObject(data)) {
            Object.keys(data).forEach(key => this.setData(key, data[key]));
        }
        return this;
    }

    /**
     * tests if a value is falsy
     *
     *@param $value - the value to test
     *@returns {boolean}
    */
    valueIsFalsy(value) {
        return value === '' || value === undefined || value === null ||
            /(false|off|0|nil|null|no|undefined)/i.test(value);
    }

    /**
     * resolves database model field name to either camelCase like or snake case
     *@param {string} field - the field to resolve
     *@return {string}
    */
    modelResolveFieldName(field) {
        if(this._dbModelCaseStyle === DB_MODEL_CASE_STYLES.CAMEL_CASE) {
            return field.split(/[-_]/).map((part, index) => {
                if (index === 0)
                    return part;

                return part.charAt(0).toUpperCase() + part.substring(1);
            }).join('');
        }

        return field.replace(/[-]/, '_');
    }

    /**
     * runs the database checks
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field being checked
     *@param {mixed} value - field value
     *@param {Object} dbChecks - the database check items
     *@param {number} index - the value index position
     *@return {Promise}
    */
    async runDBChecks(required, field, value, dbChecks, index) {
        if (dbChecks.length === 0)
            return;

        const dbChecker = this._dbChecker;
        for (const dbCheck of dbChecks) {

            const callback = dbCheck.callback;
            //if there is a callback method, use it
            if (Util.isCallable(callback)) {
                const params = Util.makeArray(dbCheck['params']);
                if (await callback(field, value, this.data, ...params)) {
                    this.setError(
                        field,
                        Util.value('err', dbCheck, 'condition not satisfied')
                    );
                    break;
                }
                continue;
            }

            const dbModel = this._dbModel;

            //throw exception if there is no if parameter
            if(typeof dbCheck['if'] !== 'string') {
                throw new MissingParameterException(
                    `missing if/condition parameter for ${field} dbCheck rule`
                );
            }

            //throw error if there is no entity or model object for nosql
            if (dbModel === DB_MODELS.NOSQL && typeof dbCheck.entity === 'undefined' &&
                typeof dbCheck.model === 'undefined') {
                throw new MissingParameterException(
                    `missing one of model and entity/collection/table nosql parameter for ${field} dbCheck rule`
                );
            }

            //throw error if model in use is relational and there is no entity, model or query param
            if (dbModel === DB_MODELS.RELATIONAL && typeof dbCheck.entity === 'undefined' &&
                typeof dbCheck.model === 'undefined' && typeof dbCheck.query === 'undefined') {
                throw new MissingParameterException(
                    `missing entity/table or query sql parameter for ${field} dbCheck rule`
                );
            }

            //default the params to array containing the field value if it is not given
            dbCheck.params = Util.arrayValue('params', dbCheck, [value]);

            //if there is no field option given, default it to the field name under validation
            dbCheck.field = Util.value(
                'field',
                dbCheck,
                dbModel === DB_MODELS.RELATIONAL && Util.isInt(value)?
                    'id' : this.modelResolveFieldName(field)
            );

            const checkIf = dbCheck['if'],
                method = Util.value(checkIf, this.getDBChecksMethodMap(), 'null');

            if (method === 'null')
                throw new InvalidParameterException(checkIf + ' is not a dbCheck rule');

            // clone db check options to avoid any side effect
            await dbChecker[method](required, field, value, dbCheck, index);
            if (dbChecker.fails())
                break;
        }
        return this.succeeds();
    }

    /**
     * runs database checks on the fields
     *
     *@param {array} fields - the array of fields to validate
     *@param {boolean} required - boolean value indicating if field is required
    */
    async validateDBChecks(fields, required) {
        for (let field of fields) {
            const dbChecks = this._dbChecks[field],
                values = Util.makeArray(this._data[field]);

            let len = values.length,
                i = -1;
            while(++i < len && await this.runDBChecks(required, field, values[i], dbChecks, i));
        }
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
    runValidation(required, field, value, options, index) {
        const validator = this._validator,
            type = options.type,
            method = Util.value(type, this.getRuleTypesMethodMap(), 'null');

        if(method === 'null')
            throw new InvalidParameterException(type + ' is not a recognised validation rule');

        if (method !== '') {
            // clone options to avoid any side effect
            validator[method](required, field, value, options, index);
            if(this.isFileField(field)) {
                const newFileName = validator.getFileName();

                if (Util.isArray(this._data[field]))
                    this._data[field].splice(index, 1, newFileName);
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
     *@param {string|string[]} stripTagsIgnore - string containing xml tags to ignore or array
     * of such strings
     *@param {}
    */
    stripTags(value, stripTagsIgnore) {
        stripTagsIgnore = (
            Util.isString(stripTagsIgnore)? stripTagsIgnore.split(/[,\s>]/) : stripTagsIgnore
        )
            .map(
                tag => tag.toLowerCase().replace(/[/<>]/g, '')
            )

            .filter(
                tag => tag !== ''
            );

        const matchName = '[_a-z][-\\w]*',
            regex = new RegExp(
                //capture tagName
                '<\\s*\\/?(' + matchName + ')'
                +
                //followed by zero or more attributes, with the attribute value optional
                '(?:\\s+' + matchName + '(?:=(?:"[^"]*"|\'[^\']*\'))?)*'
                +
                //then ends with zero or more spaces followed by the right angle bracket
                '\\s*>',
                'i'
            );

        return Regex.replaceCallback(regex, (matches) => {
            if (stripTagsIgnore.includes(matches[1].toLowerCase()))
                return matches[0];
            else
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

        if (filters.type === 'bool' || filters.type === 'checkbox')
            return !this.valueIsFalsy(value);

        if (value === null || value === undefined)
            return null;

        value = value.toString();

        if (Util.keyNotSetOrTrue('decode', filters))
            value = decodeURIComponent(value);

        //strip tags before doing any trim operations
        if (Util.keyNotSetOrTrue('stripTags', filters))
            value = this.stripTags(value, Util.value('stripTagsIgnore', filters, []));

        //this filter is great when processing computer propram data such as html, xml, json, etc
        if (Util.value(['compact', 'minimize', 'minimise'], filters)) {
            //minimise will trim lines, remove empty lines and compat the data
            value = value.split('\n').map(value => value.trim())
                .filter(value => !/^\s*$/.test(value)).join('');
        }

        // trim value
        if (Util.keyNotSetOrTrue('trim', filters))
            value = value.trim();

        //cast to float
        if (Util.keySetAndTrue('numeric', filters))
            value = Util.isNumeric(value)? parseFloat(value) : 0;

        //upper case
        if (Util.keySetAndTrue('toUpper', filters))
            value = value.toUpperCase();

        //lower case
        if (Util.keySetAndTrue('toLower', filters))
            value = value.toLowerCase();

        //capitalize
        if (Util.keySetAndTrue(['capitalize', 'capitalise'], filters))
            value = value.charAt(0).toUpperCase() + value.substring(1).toLowerCase();

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
        }

        //run callback on the value if given
        if (Util.isCallable(filters.callback))
            value = filters.callback(value);

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
        return this.isFileType(this._rules[field]['type']);
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
                value = Util.value('name', this._files[field], null);
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
        //resolve objects
        if (Util.isPlainObject(option)) {
            for (const [key, value] of Object.entries(option))
                option[key] = this.resolveOption(field, value);

            return option;
        }

        //resolve array
        if (Util.isArray(option)) {
            return option.map((value) => {
                return this.resolveOption(field, value);
            });
        }

        //if it is string or number, resolve it
        if (Util.isString(option) || Util.isNumber(option)) {
            return Regex.replaceCallback(/\{\s*([^}]+)\s*\}/, (matches) => {
                const capture = matches[1];
                let result = Util.value(capture, this._data, matches[0]);

                //while resolving, leave out this and _index, as they are runtime values
                switch(capture.toLowerCase()) {
                    case '_this':
                        result = field;
                        break;

                    case 'current_date':
                        result = '' + new CustomDate();
                        break;

                    case 'current_year':
                        result = (new CustomDate()).getFullYear();
                        break;

                    case 'current_time':
                        result = (new CustomDate()).getTime() * 1000;
                        break;
                }
                return result;
            }, option);
        }

        //otherwise, return it.
        return option;
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
     * checks the condition and returns true if condition is satified
     *@returns {boolean}
    */
    checkCondition(condition, details, filters) {
        const field = Util.value('field', details, ''),
            value = Util.value('value', details, ''),
            fieldValue = this.filterValue(
                Util.value(field, this._source),
                filters
            );

        switch(condition.toLowerCase()) {

            case 'checked':
                return !this.valueIsFalsy(fieldValue);

            case 'notchecked':
                return this.valueIsFalsy(fieldValue);

            case 'equals':
            case 'equal':
                return value == fieldValue;

            case 'notequals':
            case 'notequal':
                return value != fieldValue;
        }
    }

    /**
     * resolves overrideIf condition
     *@param {Object} rule - the rule details
     *@return {boolean}
    */
    resolveOverride(rule, filters) {
        const details = Util.objectValue('overrideIf', rule),
            condition = Util.value(['if', 'condition'], details, ''),
            result = {
                override: false,
                with: Util.value('with', details, null)
            };

        if (condition !== '') {
            result.override = this.checkCondition(condition, details, filters);
            Util.deleteFromObject('overrideIf', rule);
        }
        return result;
    }

    /**
     * resolves require condition
     *@param {Object} rule - the rule details
     *@return {boolean}
    */
    resolveRequire(rule, filters) {
        let result = typeof rule.required === 'undefined'? true : !!rule.required;

        const details = Util.objectValue(['requiredIf', 'requireIf'], rule),
            condition = Util.value(['if', 'condition'], details, '');

        if (condition !== '') {
            result = this.checkCondition(condition, details, filters);
            Util.deleteFromObject(['requiredIf', 'requireIf'], rule);
        }

        return result;
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

        //resolve if condition
        const condition = Util.value(['$if', 'if', 'condition'], dbCheck);
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
            Util.deleteFromObject(['$if', 'condition'], dbCheck);
        }

        //resolve entity field
        const entityKeys = ['table', 'collection'],
            entity = Util.value(entityKeys, dbCheck);

        if (entity !== undefined) {
            dbCheck['entity'] = entity;
            Util.deleteFromObject(entityKeys, dbCheck);
        }

        return dbCheck;
    }

    /**
     * processes the rules, extracting the portions as the need be
     *@protected
    */
    processRules() {
        for (const [field, rule] of Object.entries(this._rules)) {

            const type = rule.type,
                filters = Util.objectValue('filters', rule),
                options = Util.objectValue('options', rule),
                dbChecks = Util.arrayValue('checks', rule);

            filters.type = options.type = type;

            this._filters[field] = filters;
            this._ruleOptions[field] = options;

            if (typeof rule.check !== 'undefined')
                dbChecks.unshift(rule.check);
            this._dbChecks[field] = dbChecks.map(this.resolveDBChecks, this);

            //resolve override
            const override = this.resolveOverride(rule, filters);
            if (override.override)
                this._source[field] = override.with;

            //resolve require if condition
            rule.required = this.resolveRequire(rule, filters);

            if (!rule.required || type === 'checkbox') {
                this._optionalFields.push(field);
                this._defaultValues[field] = Util.value(['$default', 'default', 'defaultValue'], rule, null);
            }
            else {
                this._requiredFields.push(field);
                this._hints[field] = Util.value('hint', rule, `${field} is required`);
            }
        }
    }

    /**
     * filters rules that applies to the sent data
     *@protected
    */
    filterRules(requiredFields) {
        requiredFields = Util.makeArray(requiredFields);

        this._rules = Object.entries(this._rules).reduce((result, [field, value]) => {
            const isFileField = this.isFileField(field);

            if (requiredFields.includes(field))
                result[field] = value;

            else if (!isFileField && typeof this._source[field] !== 'undefined')
                result[field] = value;

            else if (isFileField && this._files && typeof this._files[field] !== 'undefined')
                result[field] = value;

            return result;
        }, {});
    }

    /**
     * merges the fields and the added field
     *@protected
    */
    mergeSource() {
        this._source = {...this._source, ...this._addedFields};
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
     * returns boolean indicating if the execute call should proceed
     *@protected
     *@return {boolean}
     *@throws {DataSourceNotSetException}
     *@throws {RulesNotSetException}
    */
    shouldExecute() {
        if (this._executed)
            throw new StateException('A handler can only be executed once');

        if (this._source === null)
            throw new DataSourceNotSetException('no data source set');

        if (this._rules === null)
            throw new RulesNotSetException('no validation rules set');

        //resolve all rules to objects
        const fields = Object.keys(this._rules);
        for (const field of fields) {
            let rule = this._rules[field];

            if (Util.isString(rule))
                rule = {type: rule};

            rule.type = this.resolveType(Util.value('type', rule, 'text'));
            this._rules[field] = rule;
        }

        //if there is a file field, and the user did not set the files object, throw
        if (!this._files && fields.some(field => this.isFileType(this._rules[field].type)))
            throw new FilesSourceNotSetException('no file source set');

        return true;
    }

    /**
     *@param {Object} [source] - the data source
     *@param {Object} [files] - the files source
     *@param {Object} [rules] - the data rules
     *@param {Validator} [validator] - the validator instance
     *@param {DBChecker} [dbChecker] - the db checker instance
    */
    constructor(source, files, rules, validator, dbChecker) {
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

        /* the db checker instance */
        this._dbChecker = null;

        // database model in use
        this._dbModel = null;

        //database model case style in use
        this._dbModelCaseStyle = null;

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

        /* object of processed data */
        this._data = {};

        /* array of fields to skip while mapping data to model */
        this._modelSkipFields = [];

        /* object of field new names to use when mapping field data to model */
        this._modelRenameFields = {};

        if (!(validator instanceof Validator))
            validator = new Validator();

        if (!(dbChecker instanceof DBChecker))
            dbChecker = new DBChecker();

        this.setSource(source).setFiles(files).setRules(rules).setValidator(validator)
            .setDBChecker(dbChecker).modelUseNoSql().modelUseCamelCaseStyle();
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
     * sets the db checker instance
     *@param {DBChecker} dbChecker
     *@return {this}
    */
    setDBChecker(dbChecker) {
        if (dbChecker instanceof DBChecker) {
            dbChecker.setErrorBag(this._errors);
            this._dbChecker = dbChecker;
        }

        return this;
    }

    /**
     * turns the used db model to noSql
     *@return {this}
    */
    modelUseNoSql() {
        this._dbModel = DB_MODELS.NOSQL;
        return this;
    }

    /**
     * turns the used db model to relational
     *@return {this}
    */
    modelUseRelational() {
        this._dbModel = DB_MODELS.RELATIONAL;
        return this;
    }

    /**
     * turns the used db model case style to camel case
     *@return {this}
    */
    modelUseCamelCaseStyle() {
        this._dbModelCaseStyle = DB_MODEL_CASE_STYLES.CAMEL_CASE;
        return this;
    }

    /**
     * turns the used db model case to snake case
     *@return {this}
    */
    modelUseSnakeCaseStyle() {
        this._dbModelCaseStyle = DB_MODEL_CASE_STYLES.SNAKE_CASE;
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
     * defines a field that should be skipped while mapping to a model
     *@param {string} field
     *@return {this}
    */
    modelSkipField(field) {
        if (typeof field === 'string' && !this._modelSkipFields.includes(field))
            this._modelSkipFields.push(field);

        return this;
    }

    /**
     * defines array of fields that should be skipped while mapping to a model
     *
     *@param {string[]} fields - array of fields
     *@return {this}
    */
    modelSkipFields(fields) {
        if (Util.isArray(fields)) {
            fields.forEach(this.modelSkipField, this);
        }
        return this;
    }

    /**
     * defines the new name to use when mapping field data to a model
     *@param {string} field
     *@param {string} newName
     *@return {this}
    */
    modelRenameField(field, newName) {
        if (typeof newName === 'string' && typeof field === 'string')
            this._modelRenameFields[field] = newName;

        return this;
    }

    /**
     * defines the new names to use when mapping field data to a model
     *@param {Object} newNames - object of oldName: newName entries
     *@return {this}
    */
    modelRenameFields(newNames) {
        if (Util.isPlainObject(newNames)) {
            for (let [field, newName] of Object.entries(newNames)) {
                this.modelRenameField(field, newName);
            }
        }

        return this;
    }

    /**
     * executes the handler
     *@param {boolean} [validateOnDemand=false] - boolean value indicating if it should only
     * pick and validate fields that were sent and whose rules are defined
     *@param {string|string[]} requiredFields - field or array of fields that must be included
     * whether they were sent or not, if validateOnDemand is set to true
     *@returns {Promise}
     *@throws {DataSourceNotSetException}
     *@throws {RulesNotSetException}
    */
    async execute(validateOnDemand, requiredFields) {

        this.shouldExecute();
        this._executed = true;

        this.mergeSource();

        if (validateOnDemand)
            this.filterRules(requiredFields);

        this.processRules();
        this.resolveOptions(this._hints);

        if (!this.checkMissingFields())
            return false;

        this.getFields();

        this.resolveOptions(this._ruleOptions);
        this.resolveOptions(this._dbChecks);

        this._validator.setFiles(this._files);
        this.validateFields(this._requiredFields, true);
        this.validateFields(this._optionalFields, false);

        if (this.succeeds()) {
            this._dbChecker.setDBModel(this._dbModel);

            await this.validateDBChecks(this._requiredFields, true);
            await this.validateDBChecks(this._optionalFields, false);
        }

        return this.succeeds();
    }

    /**
     * returns boolean indicating if data validation and handling processes succeeded
     *@return {boolean}
    */
    succeeds() {
        return this._executed && Object.keys(this._errors).length === 0;
    }

    /**
     * returns boolean indicating if data validation and handling processes failed
     *@return {boolean}
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
     * returns all errors as an object
     *@returns {Object}
    */
    getErrors() {
        return {...this._errors};
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
     * returns all data as an object
     *@returns {Object}
    */
    getAllData() {
        return {...this._data};
    }

    /**
     * maps data to the given model object
     *@param {Object} model - the model object
     *@param {boolean} [expand=true] - boolean value inicating if it should expand .dot keys
     *@return {Object}
    */
    mapDataToModel(model, expand = true) {
        model = Util.isObject(model)? model : {};

        for(let [key, value] of Object.entries(this._data)) {
            if (this._modelSkipFields.includes(key))
                continue; //skip field

            key = Util.value(key, this._modelRenameFields, key);
            if (expand)
                model = Util.expand(model, key, value);
            else
                model[key] = value;
        }
        return model;
    }

    /**
     *@type {Object} - all the data as one object
    */
    get data() {
        return {...this._data};
    }

    /**
     *@type {Object} - all the errors as one object
    */
    get errors() {
        return {...this._errors};
    }
}