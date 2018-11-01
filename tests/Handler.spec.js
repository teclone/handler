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

describe('Handler Module', function() {
    let handler = null;

    beforeEach(function() {
        handler = new Handler;
    });

    const executeTest = function(datasets) {
        for(let [, dataset] of Object.entries(datasets)) {

            let [source, files, rules, isErroneous, messages] = dataset;
            const handler = new Handler;
            handler.setSource(source).setFiles(files).setRules(rules).execute();

            if (isErroneous) {
                expect(handler.fails()).toBeTruthy();
            }
            else {
                expect(handler.succeeds()).toBeTruthy();
            }
            Object.keys(messages).forEach(key => {
                let message = isErroneous? handler.getError(key) : handler.getData(key);
                expect(message).toEqual(messages[key]);
            });
        }
    };

    describe('#constructor(source, files, rules, validator)', function() {
        it(`should create an instance with empty argument`, function() {
            expect(new Handler()).toBeInstanceOf(Handler);
        });

        it(`should accepts a validator argument as fourth parameter`, function() {
            let validator = new Validator();
            expect(new Handler(null, null, null, validator)).toBeInstanceOf(Handler);
        });
    });

    describe('#setSource(source)', function() {
        it(`should set the data source if the given argument is a valid plain object`, function() {
            expect(handler._source).toBeNull();
            handler.setSource({});
            expect(handler._source).toEqual({});
        });

        it(`updates made on the source object should reflect in both end`, function() {
            let source = {};

            handler.setSource(source);
            expect(handler._source).toStrictEqual(source);

            source.name = 'Testing';
            expect(handler._source).toEqual({name: 'Testing'});
        });

        it(`should do nothing if argument is not a plain object`, function() {
            let source = {name: 'Testing'};

            handler.setSource(source);
            expect(handler._source).toStrictEqual(source);

            handler.setSource(null);
            expect(handler._source).toStrictEqual(source);
        });
    });

    describe('#setFiles(files)', function() {
        it(`should set the files data source if the given argument is a valid plain object`, function() {
            expect(handler._files).toBeNull();
            handler.setFiles({});
            expect(handler._files).toEqual({});
        });

        it(`updates made on the files object should reflect in both end`, function() {
            let files = {};

            handler.setFiles(files);
            expect(handler._files).toStrictEqual(files);

            files.picture = {size: 34, name: 'my-pic.jpg'};
            expect(handler._files).toStrictEqual(files);
        });

        it(`should do nothing if argument is not a plain object`, function() {
            let files = {name: 'Testing'};

            handler.setFiles(files);
            expect(handler._files).toStrictEqual(files);

            handler.setFiles(null);
            expect(handler._files).toStrictEqual(files);
        });
    });

    describe('#setRules(rules)', function() {
        it(`should set the rules object if the given argument is a valid plain object`, function() {
            expect(handler._rules).toBeNull();
            handler.setRules({});
            expect(handler._rules).toEqual({});
        });

        it(`updates made on the rules object should reflect in both end`, function() {
            let rules = {};

            handler.setRules(rules);
            expect(handler._rules).toStrictEqual(rules);

            rules.picture = {type: 'image'};
            expect(handler._rules).toStrictEqual(rules);
        });

        it(`should do nothing if argument is not a plain object`, function() {
            let rules = {
                name: {
                    type: 'text'
                }
            };

            handler.setRules(rules);
            expect(handler._rules).toStrictEqual(rules);

            handler.setRules(null);
            expect(handler._rules).toStrictEqual(rules);
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

        it(`should do nothing if argument is not a plain object`, function() {
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
        it(`should call addField on every field item in the object`, function() {
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

    describe('#getData(key)', function() {
        it(`should throw KeyNotFound Exception if the given key is not set`, function() {
            expect(function() {
                handler.getData('fieldKey');
            }).toThrow(KeyNotFoundException);
        });
    });

    describe('#succeeds()', function() {
        it(`should throw StateException if called without having executed the handler`, function() {
            expect(function() {
                handler.succeeds();
            }).toThrow(StateException);
        });
    });

    describe('#execute()', function() {
        it(`should throw DataSourceNotSet Exception if there is no data source set`, function() {
            expect(function() {
                handler.execute();
            }).toThrow(DataSourceNotSetException);
        });

        it(`should throw RulesNotSet Exception if data source is set but there is no rules
            set`, function() {
            expect(function() {
                handler.setSource(SimpleSource()).execute();
            }).toThrow(RulesNotSetException);
        });

        it(`should throw FilesSourceNotSet Exception if files source is not set and there are
            some file field types existing in our rules`, function() {
            expect(function() {
                handler.setSource(SimpleSource()).setRules({picture: {type: 'image'}}).execute();
            }).toThrow(FilesSourceNotSetException);
        });
    });

    describe('Missing Field Validation', function() {
        it(`should inspect and fish out all missing fields`, function() {
            executeTest(MissingFieldsTestProvider());
        });
    });

    describe('Filter Applications', function() {
        it(`should apply defined filters on the field values`, function() {
            executeTest(FilterTestProvider());
        });
    });
});