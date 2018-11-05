import Handler from '../src/Handler';
import Validator from '../src/Validator';
import DataSourceNotSetException from '../src/Exceptions/DataSourceNotSetException';
import SimpleSource from './Helpers/DataProviders/Handler/SimpleSource';
import RulesNotSetException from '../src/Exceptions/RulesNotSetException';
import FilesSourceNotSetException from '../src/Exceptions/FilesSourceNotSetException';
import MissingFieldsTestProvider from './Helpers/DataProviders/Handler/MissingFieldsTestProvider';
import FilterTestProvider from './Helpers/DataProviders/Handler/FilterTestProvider';
import KeyNotFoundException from '../src/Exceptions/KeyNotFoundException';
import StateException from '../src/Exceptions/StateException';
import SimpleRules from './Helpers/DataProviders/Handler/SimpleRules';
import RequireIfTestProvider from './Helpers/DataProviders/Handler/RequireIfTestProvider';
import DBCheckResolutionTestProvider from './Helpers/DataProviders/Handler/DBCheckResolutionTestProvider';
import InvalidParameterException from '../src/Exceptions/InvalidParameterException';
import { getTestFileDetails, getTestMultiFileDetails } from './Helpers/bootstrap';
import GeneralFilterErrorTest from './Helpers/DataProviders/Handler/GeneralFilterErrorTest';
import DBChecker from './Helpers/DBChecker';

describe('Handler Module', function() {
    let handler = null;

    beforeEach(function() {
        handler = new Handler;
        handler.setDBChecker(new DBChecker);
    });

    /**
     * executes a mass of data tests that targets some specific handler feature
     *@param {Object} datasets - object of datasets
     *@param {Function} done - jest done callback
    */
    const executeTest = async function(datasets, done) {
        for(let [, dataset] of Object.entries(datasets)) {

            let [source, files, rules, isErroneous, messages] = dataset;

            //create new handler and await the execute promise
            const handler = new Handler;
            handler.setDBChecker(new DBChecker);
            await handler.setSource(source).setFiles(files).setRules(rules).execute();

            if (isErroneous) {
                expect(handler.fails()).toBeTruthy();
            }
            else {
                if (handler.succeeds() === false)  {
                    console.log(handler.getErrors());
                }
                expect(handler.succeeds()).toBeTruthy();
            }

            //check on error message  expectations or fied data value expectations
            Object.keys(messages).forEach(key => {
                let value = isErroneous? handler.getError(key) : handler.getData(key);
                expect(value).toEqual(messages[key]);
            });
        }

        //we are done
        done();
    };

    /**
     * executes db check resolution test
     *@param {Object} datasets - object of datasets
     *@param {Function} done - jest done callback
    */
    const executeDBCheckResolutionTest = async function(datasets, done) {
        for(let [, dataset] of Object.entries(datasets)) {

            let [source, rules, messages] = dataset;

            //create new handler and await the execute promise
            const handler = new Handler(source, {}, rules, null, new DBChecker);
            await handler.setSource(source).setFiles({}).setRules(rules).execute();

            //check on error message  expectations or fied data value expectations
            Object.keys(messages).forEach(field => {
                const dbcheck = handler._dbChecks[field][0];
                expect(dbcheck['if']).toEqual(messages[field]);
            });
        }

        //we are done
        done();
    };

    describe('#constructor(source, files, rules, validator)', function() {
        it(`should create an instance with empty argument`, function() {
            expect(new Handler()).toBeInstanceOf(Handler);
        });

        it(`should accept a plain object of data source as first argument`, function() {
            expect(new Handler(SimpleSource())).toBeInstanceOf(Handler);
        });

        it(`should accept a plain object of files source as second argument`, function() {
            expect(new Handler(null, {})).toBeInstanceOf(Handler);
        });

        it(`should accept a plain object of rules as third argument`, function() {
            expect(new Handler(null, null, SimpleRules())).toBeInstanceOf(Handler);
        });

        it(`should accepts a validator argument as fourth parameter`, function() {
            let validator = new Validator();
            expect(new Handler(null, null, null, validator)).toBeInstanceOf(Handler);
        });
    });

    describe('#setSource(source)', function() {
        it(`should set the data source if the given argument is a valid plain object`, function() {
            expect(handler._source).toBeNull();
            let source = SimpleSource();
            expect(handler.setSource(source)._source).toStrictEqual(source);
        });
    });

    describe('#setFiles(files)', function() {
        it(`should set the files source if the given argument is a valid plain object`, function() {
            expect(handler._files).toBeNull();
            let files = {};
            expect(handler.setFiles(files)._files).toStrictEqual(files);
        });
    });

    describe('#setRules(rules)', function() {

        it(`should set the rules if the given argument is a valid plain object`, function() {
            expect(handler._rules).toBeNull();
            let rules = SimpleRules();
            expect(handler.setRules(rules)._rules).toStrictEqual(rules);
        });
    });

    describe('#setValidator(validator)', function() {
        it(`should set the validator object if the given argument inherits from
            Validator module`, function() {
            expect(handler._validator).toBeInstanceOf(Validator);

            let validator = new Validator;
            handler.setValidator(validator);
            expect(handler._validator).toStrictEqual(validator);
        });

        it(`should do nothing if argument is not an instance of Validator`, function() {
            let validator = handler._validator;
            expect(validator).toBeInstanceOf(Validator);

            handler.setValidator(null);
            expect(handler._validator).toStrictEqual(validator);
        });
    });

    describe('#addField(name, value)', function() {
        it(`should add the given field to the _addedFields instance property`, function() {
            expect(handler._addedFields).toEqual({});
            handler.addField('name', 'Harrison');
            expect(handler._addedFields).toHaveProperty('name', 'Harrison');
        });

        it(`should do nothing if name is not a string`, function() {
            expect(handler._addedFields).toEqual({});
            handler.addField(22, 'Harrison');
            expect(handler._addedFields).not.toHaveProperty('22');
        });
    });

    describe('#addFields(fields)', function() {
        it(`should call the addField method on every field item in the object`, function() {
            expect(handler._addedFields).toEqual({});
            handler.addFields({
                name: 'Harrison',
                age: 22
            });
            expect(handler._addedFields).toHaveProperty('name', 'Harrison');
            expect(handler._addedFields).toHaveProperty('age', 22);
        });

        it(`should do nothing if argument is not a plain object`, function() {
            expect(handler._addedFields).toEqual({});
            handler.addFields();

            expect(handler._addedFields).toEqual({});
        });
    });

    describe('#modelSkipField(fieldName)', function() {
        it(`should add the given field to the list of fields to skip while mapping
            validated data to model`, function() {
            expect(handler._modelSkipFields).toHaveLength(0);
            expect(handler.modelSkipField('name')._modelSkipFields).toHaveLength(1);
        });

        it(`should do nothing if argument is not a string or if argument is already in
        the skip fields array`, function() {
            expect(handler._modelSkipFields).toHaveLength(0);
            expect(handler.modelSkipField('name')._modelSkipFields).toHaveLength(1);

            expect(handler.modelSkipField('name')._modelSkipFields).toHaveLength(1);
            expect(handler.modelSkipField(22)._modelSkipFields).toHaveLength(1);
        });
    });

    describe('#modelSkipFields(fields)', function() {
        it(`should call modelSkipFields on every item in the array`, function() {
            expect(handler._modelSkipFields).toHaveLength(0);
            expect(handler.modelSkipFields(['name', 'age', 'name'])._modelSkipFields)
                .toHaveLength(2);
        });

        it(`should do nothing if argument is not an array or is empty array`, function() {
            expect(handler._modelSkipFields).toHaveLength(0);
            expect(handler.modelSkipFields('name')._modelSkipFields).toHaveLength(0);

            expect(handler.modelSkipFields([])._modelSkipFields).toHaveLength(0);
        });
    });

    describe('#modelRenameField(field, newName)', function() {
        it(`should add the given field and newName to the list of field replacement names to use
            while mapping data to a model`, function() {
            expect(handler._modelRenameFields).toEqual({});
            expect(handler.modelRenameField('lName', 'lastName')._modelRenameFields)
                .toEqual({lName: 'lastName'});
        });

        it(`should do nothing if the one of the argument is not a string`, function() {
            expect(handler._modelRenameFields).toEqual({});
            expect(handler.modelRenameField(null, 'lastName')._modelRenameFields)
                .toEqual({});

            expect(handler.modelRenameField('lName', null)._modelRenameFields)
                .toEqual({});
        });
    });

    describe('#modelRenameFields(newNames)', function() {
        it(`should call modelRenameField() method on every item in the given newNames object
            `, function() {
            expect(handler._modelRenameFields).toEqual({});
            expect(handler.modelRenameFields({
                lName: 'lastName',
                fName: 'firstName',
            })._modelRenameFields)
                .toEqual({
                    lName: 'lastName',
                    fName: 'firstName',
                });
        });

        it(`should do nothing if argument is not a plain object or if it is empty`, function() {
            expect(handler._modelRenameFields).toEqual({});
            expect(handler.modelRenameFields(null)._modelRenameFields).toEqual({});

            expect(handler.modelRenameFields({})._modelRenameFields).toEqual({});
        });
    });

    describe('#execute()', function() {
        it(`should throw DataSourceNotSet Exception if there is no data source set for
            handling`, function() {
            return handler.execute().catch(function(err) {
                expect(err).toBeInstanceOf(DataSourceNotSetException);
            });
        });

        it(`should throw RulesNotSet Exception if data source is set but there is no rules
            set to be used for processing data`, function() {
            return handler.setSource(SimpleSource()).execute().catch(function(err) {
                expect(err).toBeInstanceOf((RulesNotSetException));
            });
        });

        it(`should throw FilesSourceNotSet Exception if files source is not set and there are
            some file field types existing in our rules`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute().catch(function(err) {
                expect(err).toBeInstanceOf((FilesSourceNotSetException));
            });
        });

        it(`should execute the handler once all three conditions are met and return a promise`, function() {
            expect(handler.setSource(SimpleSource()).setRules(SimpleRules()).execute())
                .toBeInstanceOf(Promise);
        });

        it(`the returned promised must always resolve to the handler instance`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(result) {
                    expect(handler).toStrictEqual(result);
                });
        });

        it(`should throw State Exception if handler is executed or called more than once`, function(done) {

            handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(handler => {
                    handler.execute().catch(function(err) {
                        expect(err).toBeInstanceOf((StateException));
                        done();
                    });
                });
        });

        it(`should throw invalid parameter Exception if it meets an unknown field validation
            rule type during the processing`, function() {
            const source = {name: 'Harrison', age: '22'},
                rules = {name: 'text', age: 'unknown'};

            return handler.setSource(source).setRules(rules).execute().catch(function(ex) {
                expect(ex).toBeInstanceOf(InvalidParameterException);
            });
        });
    });

    describe('#succeeds()', function() {
        it(`should return false if the handler has not yet been executed`, function() {
            expect(handler.succeeds()).toBeFalsy();
        });

        it(`should return true if the handler executed with no errors found`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.succeeds()).toBeTruthy();
                });
        });

        it(`should return false if the handler executed with one or more errors found`, function() {
            return handler.setSource({}).setRules({name: {type: 'text'}}).execute()
                .then(function(handler) {
                    expect(handler.succeeds()).toBeFalsy();
                });
        });
    });

    describe('#fails()', function() {
        it(`should return true if the handler has not yet been executed`, function() {
            expect(handler.fails()).toBeTruthy();
        });

        it(`should return false if the handler executed with no errors found`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.fails()).not.toBeTruthy();
                });
        });

        it(`should return true if the handler executed with one or more errors found`, function() {
            return handler.setSource({}).setRules({name: {type: 'text'}}).execute()
                .then(function(handler) {
                    expect(handler.fails()).not.toBeFalsy();
                });
        });
    });

    describe('#getError(key)', function() {
        it(`should return the error message for the given field key if there is`, function() {
            return handler.setSource({}).setRules({name: {type: 'text'}}).execute()
                .then(function(handler) {
                    expect(handler.getError('name')).toEqual('name is required');
                });
        });

        it(`should return arbitrary error message if there are errors but key is not a string
            `, function() {
            return handler.setSource({}).setRules({
                name: {type: 'text'}, age: {type: 'int'}
            }).execute()
                .then(function(handler) {
                    expect(['age is required', 'name is required'])
                        .toContain(handler.getError());
                });
        });

        it(`should return undefined if there are no errors or if there is no error for the
            given key or if key is not a string`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.getError()).toBeUndefined();
                    expect(handler.getError('name')).toBeUndefined();
                });
        });
    });

    describe('#getErrors()', function() {
        it(`should return a copy of the error message bag when called`, function() {
            return handler.setSource({}).setRules({name: {type: 'text'}}).execute()
                .then(function(handler) {
                    expect(handler.getErrors()).toEqual({
                        name: 'name is required'
                    });
                });
        });

        it(`should return the empty error bag object copy if there are no errors`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.getErrors()).toEqual({});
                });
        });
    });

    describe('#getData(key)', function() {
        it(`should return the processed data for the given key if it exists`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.getData('first-name')).toEqual('Harrison');
                });
        });

        it(`should throw KeyNotFound Exception if there is no data set for the given key`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(function() {
                        handler.getData('unknown-key');
                    }).toThrow(KeyNotFoundException);
                });
        });
    });

    describe('#setData(field, value)', function() {
        it(`should the given field data`, function() {
            expect(function() {
                handler.getData('name');
            }).toThrow(KeyNotFoundException);

            handler.setData('name', 'Harrison');
            expect(handler.getData('name')).toEqual('Harrison');
        });
    });

    describe('#setDatas(data)', function() {
        it(`should call setData for every data item in the data object`, function() {
            expect(function() {
                handler.getData('name');
            }).toThrow(KeyNotFoundException);

            handler.setDatas({
                name: 'Harrison',
                country: 'Nigeria'
            });
            expect(handler.getData('name')).toEqual('Harrison');
            expect(handler.getData('country')).toEqual('Nigeria');
        });

        it(`should do nothing if argument is not a plain javascript object`, function() {
            expect(function() {
                handler.getData('name');
            }).toThrow(KeyNotFoundException);

            handler.setDatas(new class {
                constructor(name) {
                    this.name = name;
                }
            }('Harrison'));

            expect(function() {
                handler.getData('name');
            }).toThrow(KeyNotFoundException);
        });
    });

    describe('#getAllData(key)', function() {
        it(`should return a copy of all the processed data when called`, function() {
            return handler.setSource(SimpleSource()).setRules(SimpleRules()).execute()
                .then(function(handler) {
                    expect(handler.getAllData()).toHaveProperty('first-name', 'Harrison');
                    expect(handler.getAllData()).toEqual(handler._data);
                });
        });
    });

    describe('#mapDataToModel(model?)', function() {
        let source = null,
            rules = null;
        beforeEach(function() {
            source = {
                firstName: 'Harrison',
                lastName: 'Ifeanyichukwu',
                email: 'Harrisonifeanyichukwu@gmail.com',
                phoneNumber: '08132083436',
                'address.country': 'ng',
                'address.state': 'Enugu'
            };
            rules = {
                firstName: {type: 'text'},
                lastName: {type: 'text'},
                email: {type: 'email'},
                phoneNumber: {
                    type: 'text',
                    options: {
                        regex: {
                            test: /^(08[01]|0[97]0)\d{8}$/,
                            err: '{this} is not a valid nigeria mobile number format'
                        }
                    }
                },
                'address.country': {
                    type: 'choice',
                    options: {
                        choices: ['ng', 'ca', 'gh', 'gb', 'us']
                    }
                },
                'address.state': {
                    type: 'choice',
                    options: {
                        choices: ['Enugu', 'Lagos', 'Abuja', 'Port-Harcourt']
                    }
                }
            };
        });

        it(`should map the processed data to the given model instance and return it while
            also resolving dot symbols`, function() {

            return handler.setSource(source).setRules(rules).execute().then(function(handler) {
                let mappedData = handler.mapDataToModel({existing: 'something'});
                expect(mappedData).toEqual({
                    firstName: 'Harrison',
                    lastName: 'Ifeanyichukwu',
                    email: 'Harrisonifeanyichukwu@gmail.com',
                    phoneNumber: '08132083436',
                    address: {
                        country: 'ng',
                        state: 'Enugu'
                    },
                    existing: 'something'
                });
            });
        });

        it(`should initialize model to an empty plain object if model is not an object`, function() {

            return handler.setSource(source).setRules(rules).execute().then(function(handler) {
                let mappedData = handler.mapDataToModel(null);
                expect(mappedData).toEqual({
                    firstName: 'Harrison',
                    lastName: 'Ifeanyichukwu',
                    email: 'Harrisonifeanyichukwu@gmail.com',
                    phoneNumber: '08132083436',
                    address: {
                        country: 'ng',
                        state: 'Enugu'
                    },
                });
            });
        });

        it(`should skip any field that has been asked to be skipped using the modelSkipFields
            and modelSkipField method calls`, function() {
            handler.modelSkipFields(['email', 'address.country']);

            return handler.setSource(source).setRules(rules).execute().then(function(handler) {
                let mappedData = handler.mapDataToModel(null);
                expect(mappedData).toEqual({
                    firstName: 'Harrison',
                    lastName: 'Ifeanyichukwu',
                    //email: 'Harrisonifeanyichukwu@gmail.com',
                    phoneNumber: '08132083436',
                    address: {
                        //country: 'ng',
                        state: 'Enugu'
                    },
                });
            });
        });

        it(`should rename fields as demanded using the modelRenameFields and modelRenameField
            method calls`, function() {
            handler.modelRenameFields({
                email: 'mail',
                'address.country': 'location.country',
                'address.state': 'location.state'
            }).modelSkipField('address.country');

            return handler.setSource(source).setRules(rules).execute().then(function(handler) {
                let mappedData = handler.mapDataToModel(null);
                expect(mappedData).toEqual({
                    firstName: 'Harrison',
                    lastName: 'Ifeanyichukwu',
                    mail: 'Harrisonifeanyichukwu@gmail.com',
                    phoneNumber: '08132083436',
                    location: {
                        //country: 'ng',
                        state: 'Enugu'
                    },
                });
            });
        });
    });

    describe('Missing Field Validation', function() {
        it(`should inspect and fish out all missing fields`, function(done) {
            return executeTest(MissingFieldsTestProvider(), done);
        });
    });

    describe('Filter Application', function() {
        it(`should apply defined filters on the field values`, function(done) {
            executeTest(FilterTestProvider(), done);
        });
    });

    describe('RequireIf/RequiredIf conditonal testing', function() {
        it(`should resolve requireIf/requiredIf conditional rules`, function(done) {
            executeTest(RequireIfTestProvider(), done);
        });
    });

    describe('General Error Filter test', function() {
        it(`casting filters should not apply casting to values that do not meet cast
            requirement`, function(done) {
            executeTest(GeneralFilterErrorTest(), done);
        });
    });

    describe('DBCheck if Resolution', function() {
        it(`should resolve dbcheck if/condition rules`, function(done) {
            executeDBCheckResolutionTest(DBCheckResolutionTestProvider(), done);
        });
    });

    describe('file handling', function() {
        it(`should handle and process file fields`, function() {
            const rules = {picture: 'file'},
                files = {picture: getTestFileDetails('file1.jpg', 'image/jpeg')};

            return handler.setSource({}).setRules(rules).setFiles(files).execute()
                .then(handler => {
                    expect(handler.getData('picture')).toEqual('file1.jpg');
                });
        });
    });

    describe('multi file handling', function() {
        it(`should handle and process multi file fields`, function() {
            const filenames = ['file1.jpg', 'file2.txt', 'file3'],
                mimes = ['image/jpeg', 'text/plain', 'octet/stream'],
                files = {files: getTestMultiFileDetails(filenames, mimes)},
                rules = {files: 'file'};

            return handler.setSource({}).setRules(rules).setFiles(files).execute()
                .then(handler => {
                    expect(handler.getData('files')).toEqual(filenames);
                });
        });
    });
});