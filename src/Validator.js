import Common from './Traits/Common';
import FileExtensionDetector from './FileExtensionDetector';
import Util from './Util';

/**
 * the validator module
 *
 * limiting rules options include min, max, gt (greaterThan), and lt (lessThan) options,
 *
 * Their associated errors are minErr, maxErr, gtErr, and ltErr.
 *
 * Their is the regex family options that include
 *
 * regex is an object containing test reglet moveTo = Util.value('moveTo', options, '');ex expression and associated err. The value must match
 * the regex test else, it is flagged as error
 *
 * e.g 'regex': {
 *          'test': '/regex to test/',
 *          'err': 'error to set if value does not match regex test'
 *      }
 *
 * regexAll, contains object of regex expressions that the value must match. The value
 * must match all the regex all expressions, else it is flagged as an error
 *
 * e.g 'regexAll' => [
 *      //array of regex expressions,
 *      {
 *          'test': '/regex to test/',
 *          'err': 'error message to set if the test fails'
 *      },
 *      {
 *          'test': '/another regex to test/',
 *          'err': 'error message to set if the test fails'
 *      },
 * ]
 *
 * regexAny contains array of regex expression tests which must be mathed at least for one
 * regex expression
 * It is an error if the value did not match any of the entries.
 *
 * e.g 'regexAny' => {
 *      'tests':  ['/regex test one/', '/regex test two/', .....],
 *      'err': 'error message if none of the regex matches'
 * }
 *
 * regexNone, that is an array of regex expressions.
 * It is an error if the value matches any of the regex expressions.
 *
 * 'regexNone' => [
 *      //array of regex expressions,
 *      {
 *          'test': '/regex to test/',
 *          'err': 'error message to set if the test succeeds'
 *      },
 *      {
 *          'test': '/another regex to test/',
 *          'err': 'error message to set if the test succeeds'
 *      },
 * ]
*/

export default class extends Common
{

    /**
     *@param array [$error_bag] - the error bag, passed by reference
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
     *@return {string}
    */
    getFileMagicByte() {
        return this._fileMagicByte;
    }
}