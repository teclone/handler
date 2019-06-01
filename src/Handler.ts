import {
    DataSource, FilesSource, Rules, ResolvedRules, ResolvedRule, Rule, DataType,
    Filters, RawData, DataValue, Data, Options, ErrorBag, DataTypeMethodMap, RequiredIf
} from './@types';
import { DB_MODELS, DB_MODEL_CASE_STYLES } from './Constants';
import StateException from './Exceptions/StateException';
import DataSourceNotSetException from './Exceptions/DataSourceNotSetException';
import RulesNotSetException from './Exceptions/RulesNotSetException';
import {
    isString, pickValue, copy, makeArray, isUndefined, pickObject, pickArray,
    isArray, keyNotSetOrTrue, isNumeric, isObject, isNull
} from '@forensic-js/utils';
import FilesSourceNotSetException from './Exceptions/FilesSourceNotSetException';
import FieldRuleNotFoundException from './Exceptions/FieldRuleNotFoundException';
import { replaceCallback, replace } from '@forensic-js/regex';
import Validator from './Validator';
import CustomDate from './CustomDate';
import DataProxy from './DataProxy';

export default class Handler {

    private dataSource: DataSource | null = null;

    private filesSource: FilesSource | null = null;

    private addedFields: DataSource = {};

    private rules: Rules | null = null;

    private resolvedRules: ResolvedRules = {};

    private executed: boolean = false;

    private requiredFields: string[] = [];

    private optionalFields: string[] = [];

    private validator: Validator = new Validator();

    //private dbChecker: DBChecker = new DBChecker();

    // database model in use
    private dbModel: number = DB_MODELS.NOSQL;

    private dbModelCaseStyle: number = DB_MODEL_CASE_STYLES.CAMEL_CASE;

    private dbChecks: {} = {};

    private modelSkipFields: [] = [];

    private modelRenameFields: [] = [];

    private dataTypeToMethod: DataTypeMethodMap = {

        text: 'validateText',
        date: 'validateDate',

        //integer validation methods
        int: 'validateInt',
        pInt: 'validatePInt',
        nInt: 'validateNInt',

        //number validation methods
        number: 'validateNumber',
        pNumber: 'validatePNumber',
        nNumber: 'validateNNumber',
        money: 'validateNumber',

        //boolean validation
        boolean: '',
        checkbox: '',

        email: 'validateEmail',
        url: 'validateURL',
        choice: 'validateChoice',
        range: 'validateRange',

        //file related validations
        file: 'validateFile',
        image: 'validateImage',
        audio: 'validateAudio',
        video: 'validateVideo',
        media: 'validateMedia',
        document: 'validateDocument',
        archive: 'validateArchive',

        //password validation
        password: 'validatePassword'
    };

    public data: Data = new Proxy<Data>({}, DataProxy);

    public errors: ErrorBag = {};

    constructor(dataSource?: DataSource, filesSource?: FilesSource, rules?: Rules,
        validator?: Validator) {

        this.setDataSource(dataSource).setFilesSource(filesSource).setRules(rules)
            .setValidator(validator || new Validator());
        //.setDBChecker(dbChecker).modelUseNoSql().modelUseCamelCaseStyle();
    }

    /**
     * returns true if value is falsy
     */
    private valueIsFalsy(value: string): boolean {
        return value === '' || /(false|off|0|nil|null|none|undefined|no)/i.test(value);
    }

    /**
     * returns true if the given data type is a file data type
     */
    private isFileDataType(dataType: DataType): boolean {
        return ['file', 'image', 'audio', 'video', 'media', 'document', 'archive'].includes(dataType);
    }

    /**
     * returns true if the given field's type is a file data type
     */
    private isFileField(field: string): boolean {
        return this.isFileDataType(this.resolvedRules[field].type);
    }

    /**
     * carries out data validation
     */
    private async runValidation(required: boolean, field: string, type: DataType, value: string,
        options: Options, index: number) {

        const validator = this.validator;
        const method = this.dataTypeToMethod[type];
        if (method !== '') {
            await validator[method](required, field, value, options, index);
            if (this.isFileField(field)) {

                const newFileName = validator.getFileName();
                const data = this.data[field];

                if (isArray<string | number | boolean>(data)) {
                    data.splice(index, 1, newFileName);
                }
                else {
                    this.data[field] = newFileName;
                }
            }
        }
    }

    private async validateFields(fields: string[], required: boolean) {

        for (const field of fields) {
            const { options, type } = this.resolvedRules[field];
            const values = makeArray<string | boolean | number>(this.data[field]);

            const len = values.length;
            let i = -1;

            while (++i < len && await this.runValidation(required, field, type, values[i].toString(), options, i));
        }
    }

    /**
     * retrieves fields' data
    */
    private getFields(fields: string[]) {
        fields.forEach(field => {

            const filters = this.resolvedRules[field].filters;
            const defaultValue = this.resolvedRules[field].defaultValue || '';

            const isFileField = this.isFileField(field);
            const fieldIsMissing = this.fieldIsMissing(field);

            let value: RawData | DataValue = '';
            if (isFileField) {
                value = fieldIsMissing ? defaultValue : (this.filesSource as FilesSource)[field].name;
            }
            else {
                value = fieldIsMissing ? defaultValue : (this.dataSource as DataSource)[field];
            }

            this.data[field] = this.filterValue(value, this.resolvedRules[field].type, filters);
        });
    }

    /**
     * returns true if field is missing
    */
    private fieldIsMissing(field: string) {
        const isFileField = this.isFileField(field);

        if (isFileField) {
            return isUndefined((this.filesSource as FilesSource)[field]);
        }

        else if (isUndefined((this.dataSource as DataSource)[field])) {
            return true;
        }

        let value = (this.dataSource as DataSource)[field];
        if (isString(value)) {
            return value === '';
        }
        else {
            value = value.filter(current => current !== '');
            (this.dataSource as DataSource)[field] = value;
            return value.length === 0;
        }
    }

    /**
     * checks for missing required fields
     */
    private checkMissingFields(): boolean {
        this.requiredFields.forEach((field) => {
            if (this.fieldIsMissing(field)) {
                this.setError(field, this.resolvedRules[field].hint);
            }
        });
        return this.succeeds();
    }

    /**
     * resolves an option
    */
    private resolveOption(field: string, options: any) {

        const data = this.data;
        const resolve = (field: string, value: string) => {
            return replaceCallback(/\{\s*([^}]+)\s*\}/, (matches) => {
                const capture = matches[1];
                let result: string | number = pickValue(capture, data, matches[0]);

                //while resolving, leave out this and _index, as they are runtime values
                switch (capture.toLowerCase()) {
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
                return result.toString();
            }, value);
        };

        if (isObject<Options>(options)) {
            for (const [key, value] of Object.entries(options)) {
                options[key] = this.resolveOption(field, value);
            }
            return options;
        }

        if (isArray(options)) {
            return options.map((value) => {
                return this.resolveOption(field, value);
            });
        }

        if (isString(options)) {
            return resolve(field, options);
        }

        return options;
    }

    /**
     * resolves the specific target objects within all resolvedrules
     */
    private resolveOptions(target: keyof ResolvedRule) {
        Object.keys(this.resolvedRules).forEach(field => {
            const rule = this.resolvedRules[field];
            rule[target] = this.resolveOption(field, rule[target]);
        });
    }

    /**
     * extracts required fields and optional fields.
     * @param rules
     */
    private processRules(rules: ResolvedRules) {
        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            if (rule.required) {
                this.requiredFields.push(field);
            }
            else {
                this.optionalFields.push(field);
            }
        });
    }

    private filterRules(rules: ResolvedRules, requredFields: string | string[]): ResolvedRules {

        requredFields = makeArray(requredFields || []);

        return Object.keys(rules).reduce((result, field) => {
            const rule = rules[field];
            const isFileDataType = this.isFileDataType(rule.type);

            if (requredFields.includes(field)) {
                result[field] = rule;
            }
            else if (isFileDataType && !isUndefined((this.filesSource as FilesSource)[field])) {
                result[field] = rule;
            }
            else if (!isFileDataType && !isUndefined((this.dataSource as DataSource)[field])) {
                result[field] = rule;
            }
            return result;
        }, {});
    }

    /**
     * strips html tags from the given value
     */
    private stripTags(value: string, stripTagsIgnore: string | string[]) {

        if (isString(stripTagsIgnore)) {
            stripTagsIgnore = stripTagsIgnore.split(/[,\s>]/);
        }
        stripTagsIgnore = stripTagsIgnore.map(tag => tag.toLowerCase().replace(/[/<>]/g, '')).filter(tag => tag !== '');

        const matchName = '[_a-z][-\\w]*';
        const regex = new RegExp(
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

        return replaceCallback(regex, (matches) => {
            if (stripTagsIgnore.includes(matches[1].toLowerCase())) {
                return matches[0];
            }
            else {
                return '';
            }
        }, value);
    }

    /**
     * runs defined filters on the given value and returns the result
     */
    private filterValue(value: RawData, type: DataType, filters: Filters): DataValue {

        const performFilter = (value: string, type: DataType, filters: Filters) => {

            let result: string | number | boolean = value;

            if (type === 'checkbox' || type === 'boolean') {
                return !this.valueIsFalsy(value);
            }

            //decode value
            if (keyNotSetOrTrue('decode', filters)) {
                result = decodeURIComponent(result);
            }

            //strip tags before doing any trim operations
            if (keyNotSetOrTrue('stripTags', filters)) {
                result = this.stripTags(result, pickValue('stripTagsIgnore', filters, []));
            }

            //minimize data by triming and removing empty lines, suitable when handling
            //computer proprams such as html, xml, json, etc
            if (filters.minimize) {
                result = result.split(/\r\n|\r|\n/).map(value => value.trim()).filter(value => !/^\s*$/.test(value)).join(' ');
            }

            // trim value
            if (keyNotSetOrTrue('trim', filters)) {
                result = result.trim();
            }

            //cast to float
            if (filters.toNumeric) {
                result = isNumeric(result) ? parseFloat(result) : 0;
            }

            //upper case
            if (filters.toUpper) {
                result = (result as string).toUpperCase();
            }
            //lower case
            else if (filters.toLower) {
                result = (result as string).toLowerCase();
            }
            //capitalize
            else if (filters.capitalize) {
                result = (result as string).charAt(0).toUpperCase() + (result as string).substring(1).toLowerCase();
            }

            switch (type) {
                case 'email':
                    result = replace(/[^-\w!#$%&'*+/=?^`{|}~.@]/, '', result as string);
                    break;

                case 'url':
                    result = replace(/[^-\w!#$%&'*+/=?^`:?{|}()~.@]/, '', result as string);
                    break;

                case 'int':
                case 'nInt':
                case 'pInt':
                    if (isNumeric(result)) {
                        result = parseInt(result as any as string);
                    }
                    break;

                case 'number':
                case 'nNumber':
                case 'pNumber':
                case 'money':
                    if (isNumeric(result)) {
                        result = parseFloat(result as any as string);
                    }
                    break;
            }

            //run callback on the value if given
            if (filters.callback) {
                result = filters.callback(result.toString());
            }

            return result;
        };

        if (isArray(value)) {
            return value.map(current => performFilter(current.toString(), type, filters)) as DataValue;
        }
        else {
            return performFilter(value.toString(), type, filters);
        }
    }

    /**
     * resolves all requiredIf conditional rule
     */
    private resolveRequiredIf(rules: ResolvedRules): ResolvedRules {

        for (const [field, rule] of Object.entries(rules)) {

            const requiredIf = rule.requiredIf;
            if (isObject<RequiredIf>(requiredIf)) {

                const targetField = requiredIf.field;
                const targetFieldRule = rules[targetField];

                if (isUndefined(rules[targetField])) {
                    throw new FieldRuleNotFoundException(targetField);
                }

                switch (requiredIf.if) {
                    case 'checked':
                        rule.required = !!this.filterValue(
                            pickValue(targetField, this.dataSource as DataSource, ''),
                            targetFieldRule.type,
                            targetFieldRule.filters
                        );
                        break;

                    case 'notChecked':
                        rule.required = !this.filterValue(
                            pickValue(targetField, this.dataSource as DataSource, ''),
                            targetFieldRule.type,
                            targetFieldRule.filters
                        );
                        break;

                    case 'equals':
                        rule.required = this.filterValue(
                            pickValue(targetField, this.dataSource as DataSource, ''),
                            targetFieldRule.type,
                            targetFieldRule.filters
                        ) === requiredIf.value;
                        break;

                    case 'notEquals':
                        rule.required = this.filterValue(
                            pickValue(targetField, this.dataSource as DataSource, ''),
                            targetFieldRule.type,
                            targetFieldRule.filters
                        ) !== requiredIf.value;
                        break;
                }
            }
        }
        return rules;
    }

    /**
     * resolves the rule and returns the result
     */
    private resolveRule(field, rule: Rule | DataType): ResolvedRule {

        if (isString(rule)) {
            rule = { type: rule } as Rule;
        }

        const result: ResolvedRule = {
            type: pickValue('type', rule, 'text'),
            required: pickValue('required', rule, true),
            defaultValue: pickValue('defaultValue', rule, undefined),
            hint: pickValue('hint', rule, `${field} is required`),
            requiredIf: pickValue('requiredIf', rule, undefined),
            options: pickObject('options', rule),
            filters: pickObject('filters', rule),
            checks: pickArray('checks', rule),
        };

        //enclose the target field if it is not enclosed
        if (!isUndefined(result.options.shouldMatch)) {
            if (isString(result.options.shouldMatch)) {
                result.options.shouldMatch = {target: result.options.shouldMatch};
            }
            if (result.options.shouldMatch.target.charAt(0) !== '{') {
                result.options.shouldMatch.target = `{${result.options.shouldMatch.target}}`;
            }
        }

        if (result.type === 'checkbox' || typeof result.defaultValue !== 'undefined') {
            result.required = false;
        }
        return result;
    }

    /**
     * resolves the given rules
     */
    private resolveRules(rules: Rules): ResolvedRules {

        const fields = Object.keys(rules);
        const result = fields.reduce((result, field) => {
            const rule = rules[field];
            result[field] = this.resolveRule(field, rule);
            return result;
        }, {});

        //if there is a file field, and the user did not set the files object, throw
        if (isNull(this.filesSource) && fields.some(field => this.isFileDataType(result[field].type))) {
            throw new FilesSourceNotSetException();
        }
        return result;
    }

    /**
     * checks if the handler should be executed
     */
    private shouldExecute() {
        if (this.executed) {
            throw new StateException('A handler can only be executed once');
        }

        if (this.dataSource === null) {
            throw new DataSourceNotSetException();
        }

        if (this.rules === null) {
            throw new RulesNotSetException();
        }
    }

    /**
     * sets the data source object if given
     */
    setDataSource(dataSource?: DataSource): this {
        if (dataSource) {
            this.dataSource = dataSource;
        }
        return this;
    }

    /**
     * sets the files source object if given
     */
    setFilesSource(filesSource?: FilesSource): this {
        if (filesSource) {
            this.filesSource = filesSource;
        }
        return this;
    }

    /**
     * set rules
     */
    setRules(rules?: Rules): this {
        if (rules) {
            this.rules = rules;
        }
        return this;
    }

    /**
     * sets the validator if given
     */
    setValidator(validator: Validator): this {
        validator.setErrorBag(this.errors);
        this.validator = validator;
        return this;
    }

    /**
     * sets the error message
     */
    setError(field: string, errorMessage: string): this {
        this.errors[field] = errorMessage;
        return this;
    }

    /**
     * asynchronously executes the handler instance
     *
     * @param validateOnDemand boolean value indicating if it should only pick and validate
     * fields that were sent and whose rules are defined. perfect when performing data updates
     * @param requredFields field or array of fields that must be included when validating on
     * demand, even if they were not sent.
     */
    async execute(validateOnDemand: boolean = false, requredFields: string[] | string = '') {

        this.shouldExecute();
        this.executed = true;
        this.dataSource = copy({}, this.dataSource as DataSource, this.addedFields);

        this.resolvedRules = this.resolveRules(this.rules as Rules);
        this.resolvedRules = this.resolveRequiredIf(this.resolvedRules);

        if (validateOnDemand) {
            this.resolvedRules = this.filterRules(this.resolvedRules, requredFields);
        }
        this.processRules(this.resolvedRules);

        //resolve hints
        this.resolveOptions('hint');
        if (!this.checkMissingFields()) {
            return false;
        }

        this.getFields(this.requiredFields);
        this.getFields(this.optionalFields);

        //resolve options.
        this.resolveOptions('options');
        this.resolveOptions('checks');

        this.validator.setFiles(this.filesSource);
        await this.validateFields(this.requiredFields, true);
        await this.validateFields(this.optionalFields, false);

        return this.succeeds();
    }

    /**
     * returns true if the handler has been executed and no errors were found
     */
    succeeds(): boolean {
        return this.executed && Object.keys(this.errors).length === 0;
    }

    /**
     * return true if handler has not been executed or if it has been executed but there are
     * some errors found
     */
    fails(): boolean {
        return !this.succeeds();
    }

    /**
     * returns the resolved rule, only useful for testing
     */
    getResolvedRules() {
        return this.resolvedRules;
    }
}