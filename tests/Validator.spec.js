/** use php like test data providers */
import Validator from '../src/Validator';
import FileExtensionDetector from '../src/FileExtensionDetector';
import InvalidDateException from '../src/Exceptions/InvalidDateException';
import FilesSourceNotSetException from '../src/Exceptions/FilesSourceNotSetException';

import TypeRulesTestProvider from './Helpers/DataProviders/RegexRuleValidation/TypeRulesTestProvider';

import MinTestProvider from './Helpers/DataProviders/LimitingRuleValidation/MinTestProvider';
import MaxTestProvider from './Helpers/DataProviders/LimitingRuleValidation/MaxTestProvider';
import GtTestProvider from './Helpers/DataProviders/LimitingRuleValidation/GtTestProvider';
import LtTestProvider from './Helpers/DataProviders/LimitingRuleValidation/LtTestProvider';
import UnitResolutionTestProvider from './Helpers/DataProviders/LimitingRuleValidation/UnitResolutionTestProvider';

import RegexRuleTestProvider from './Helpers/DataProviders/RegexRuleValidation/RegexRuleTestProvider';
import RegexNoneTestProvider from './Helpers/DataProviders/RegexRuleValidation/RegexNoneTestProvider';
import RegexAllTestProvider from './Helpers/DataProviders/RegexRuleValidation/RegexAllTestProvider';
import RegexAnyTestProvider from './Helpers/DataProviders/RegexRuleValidation/RegexAnyTestProvider';
import SizeTestProvider from './Helpers/DataProviders/FileValidation/SizeTestProvider';
import { getTestFileDetails, getTestMultiFileDetails } from './Helpers/bootstrap';
import ExtensionTestProvider from './Helpers/DataProviders/FileValidation/ExtensionTestProvider';
import VarietyTestProvider from './Helpers/DataProviders/FileValidation/VarietyTestProvider';
import fs from 'fs';
import path from 'path';
import DirectoryNotFoundException from '../src/Exceptions/DirectoryNotFoundException';
import FileMoveException from '../src/Exceptions/FileMoveException';
import TypesMethods from './Helpers/DataProviders/TypesMethods';

describe('Validator module', function() {
    let validator = null;

    const executeTest = function(datasets) {
        for (let [, dataset] of Object.entries(datasets)) {
            let [method, fieldName, values, options={}, errors=[], isRequired=true] = dataset,
                isErrorneous = errors.length > 0? true : false;

            values.forEach((value, index) => {
                validator[method](isRequired, fieldName, value, options, 0);

                if(isErrorneous) {
                    expect(validator.fails()).toBeTruthy();
                    expect(validator.getError(fieldName)).toEqual(errors[index]);
                }
                else {
                    expect(validator.succeeds()).toBeTruthy();
                }

                expect(function() {
                    validator.validateFile(true, 'picture', 'my-picture.png', {}, 0);
                }).toThrowError(FilesSourceNotSetException);
            });
        }
    };

    const executeFileTest = function(datasets) {
        for (let [, dataset] of Object.entries(datasets)) {
            let [method, filename, type, options={}, error='', isRequired=true] = dataset,
                isErrorneous = error === ''? false : true;

            const files = {'file': getTestMultiFileDetails([filename], [type])};

            validator.setFiles(files);
            validator[method](isRequired, 'file', filename, options, 0);

            if(isErrorneous) {
                expect(validator.fails()).toBeTruthy();
                expect(validator.getError('file')).toEqual(error);
            }
            else {
                if (validator.fails())
                    console.log(validator.getError());

                expect(validator.succeeds()).toBeTruthy();
            }
        }
    };

    beforeEach(function() {
        validator = new Validator();
    });

    describe('#constructor(files, errorBag, fileExtensionDetector)', function() {
        it('all three options are optional', function() {
            expect(new Validator()).toBeInstanceOf(Validator);
        });

        it('we can pass in a generic fileExtensionDetector while creating the instance', function() {
            expect(new Validator(null, null, new FileExtensionDetector)).toBeInstanceOf(Validator);
        });
    });

    describe('#setFiles(files)', function() {
        it(`should set the files object to the given plain object argument`, function() {
            const files = {};
            validator.setFiles(files);

            expect(validator._files).toStrictEqual(files);
        });

        it(`should do nothing if argument is not a plain object`, function() {
            const files = {};
            validator.setFiles(files);

            expect(validator._files).toStrictEqual(files);
            validator.setFiles(null);

            expect(validator._files).toStrictEqual(files);
        });
    });

    describe('#setFileExtensionDetector(fileExtensionDetector)', function() {
        it(`should set the file extension detector to the given argument`, function() {
            const fileExtensionDetector = new FileExtensionDetector();
            validator.setFileExtensionDetector(fileExtensionDetector);

            expect(validator._fileExtensionDetector).toStrictEqual(fileExtensionDetector);
        });

        it(`should do nothing if argument does not inherit from FileExtensionDetector`, function() {
            const fileExtensionDetector = new FileExtensionDetector();
            validator.setFileExtensionDetector(fileExtensionDetector);

            expect(validator._fileExtensionDetector).toStrictEqual(fileExtensionDetector);

            validator.setFileExtensionDetector({});
            expect(validator._fileExtensionDetector).toStrictEqual(fileExtensionDetector);
        });
    });

    describe('Required and non Required Field Validation', function() {
        it(`non required fields should be validated to true if it is empty, undefined or null`, function() {
            let field = 'field';
            validator.setFiles({});
            TypesMethods().forEach(method => {
                expect(validator[method](false, field, '', {}, 0)).toBeTruthy();
                expect(validator[method](false, field, null, {}, 0)).toBeTruthy();
                expect(validator[method](false, field, undefined, {}, 0)).toBeTruthy();
            });
        });

        it(`required fields should be validated to false if it is empty, undefined or null`, function() {
            let field = 'field';
            validator.setFiles({});
            TypesMethods().forEach(method => {
                expect(validator[method](true, field, '', {}, 0)).toBeFalsy();
                expect(validator[method](true, field, null, {}, 0)).toBeFalsy();
                expect(validator[method](true, field, undefined, {}, 0)).toBeFalsy();
            });
        });
    });

    describe('Type Rules Validation', function() {
        it(`it should validate field types and return false if validation fails, otherwise
            return true`, function() {
            executeTest(TypeRulesTestProvider());
        });
    });

    describe('Min Limiting Rule Validation', function() {
        it(`it should validate min limiting rule and return false if validation fails, otherwise
            return true`, function() {
            executeTest(MinTestProvider());
        });
    });

    describe('Max Limiting Rule Validation', function() {
        it(`it should validate max limiting rule and return false if validation fails, otherwise
            return true`, function() {
            executeTest(MaxTestProvider());
        });
    });

    describe('Gt Limiting Rule Validation', function() {
        it(`it should validate gt limiting rule and return false if validation fails, otherwise
            return true`, function() {
            executeTest(GtTestProvider());
        });
    });

    describe('Lt Limiting Rule Validation', function() {
        it(`it should validate lt limiting rule and return false if validation fails, otherwise
            return true`, function() {
            executeTest(LtTestProvider());
        });
    });

    describe('regex Rule Validation', function() {
        it(`it should validate regex rule option and return false if validation fails, otherwise
            return true`, function() {
            executeTest(RegexRuleTestProvider());
        });
    });

    describe('regexAll Rule Validation', function() {
        it(`it should validate regexAll rule option and return false if validation fails, otherwise
            return true`, function() {
            executeTest(RegexAllTestProvider());
        });
    });

    describe('regexAny Rule Validation', function() {
        it(`it should validate regexAny rule option and return false if validation fails, otherwise
            return true`, function() {
            executeTest(RegexAnyTestProvider());
        });
    });

    describe('regexNone Rule Validation', function() {
        it(`it should validate regexNone rule option and return false if validation fails, otherwise
            return true`, function() {
            executeTest(RegexNoneTestProvider());
        });
    });

    describe('Limiting Rule Value Unit Resolution', function() {
        it(`it should resolve file size units such as mb, kb, tb, gb and
            bytes accordingly`, function() {
            executeTest(UnitResolutionTestProvider());
        });
    });

    describe('Invalid Date Exception', function() {
        it(`it should throw invalidDateException if a date limiting rule is not a valid
            date`, function() {
            expect(function() {
                validator.validateDate(true, 'date-of-birth', '1996-01-04', {
                    min: '01-01-1990',
                }, 0);
            }).toThrowError(InvalidDateException);
        });
    });

    describe('Files Source not set Exception', function() {
        it(`it should throw FilesSourceNotSetException if we try to validate files without
            setting file sources through the constructor or using the setFiles instance
            method`, function() {
            expect(function() {
                validator.validateFile(true, 'picture', 'my-picture.png', {}, 0);
            }).toThrowError(FilesSourceNotSetException);
        });
    });

    describe('File Size validation', function() {
        it(`it should validate file size and return false if it fails, or true if
            otherwise`, function() {
            executeFileTest(SizeTestProvider());
        });
    });

    describe('File Extension validation', function() {
        it(`it should validate file extension and return false if it fails, or true if
            otherwise`, function() {
            executeFileTest(ExtensionTestProvider());
        });
    });

    describe('File Methods validation', function() {
        it(`it should run all file methods for the specific file type and return false if it
            fails, or true if otherwise`, function() {
            executeFileTest(VarietyTestProvider());
        });
    });

    describe('File Move Option & Handling', function() {
        it(`it should move the file upload to the given moveTo directory`, function() {
            let file = 'file1.jpg';

            validator.setFiles({file: getTestFileDetails(file, 'image/jpeg')});
            validator.validateFile(true, 'file', file, {
                moveTo: __dirname
            }, 0);
            //confirm that getFileName is not empty
            const newFileName = validator.getFileName();
            expect(validator.succeeds()).toBeTruthy();

            expect(newFileName).not.toEqual('');
            expect(fs.existsSync(path.join(__dirname, newFileName)));

            fs.renameSync(
                path.join(__dirname, newFileName),
                path.join(__dirname, 'Helpers/Files', file)
            );
        });

        it(`it should throw Directory Not Found Exception if the given moveTo directory does
            not exist`, function() {
            let file = 'file1.jpg';

            validator.setFiles({file: getTestFileDetails(file, 'image/jpeg')});
            expect(function() {
                validator.validateFile(true, 'file', file, {
                    moveTo: path.join(__dirname, 'FilesFolders')
                }, 0);
            }).toThrowError(DirectoryNotFoundException);
        });

        it(`it should throw File Move Exception if there is no write access permission on the
            given move to directory`, function() {
            let file = 'file1.jpg';

            validator.setFiles({file: getTestFileDetails(file, 'image/jpeg')});
            expect(function() {
                validator.validateFile(true, 'file', file, {
                    moveTo: path.join('/root')
                }, 0);
            }).toThrowError(FileMoveException);
        });
    });

    describe('#getFileMagicByte()', function() {
        it(`it should return the magic byte for the last file detection made, returining
            empty string if there is no file detection made`, function() {

            expect(validator.getFileMagicByte()).toEqual('');
            let file = 'file1.jpg';

            validator.setFiles({file: getTestFileDetails(file, 'image/jpeg')});
            validator.validateFile(true, 'file', file, {}, 0);

            expect(validator.getFileMagicByte()).not.toEqual('');
        });
    });
});