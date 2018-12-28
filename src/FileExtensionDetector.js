import FileNotFoundException from './Exceptions/FileNotFoundException';
import FileReadException from './Exceptions/FileReadException';
import Util from './Util';
import fs from 'fs';

/**
 * file extension detector module
*/
export default class FileExtensionDetector {

    constructor() {
        this._extensions = {
            //jpeg
            'ffd8ff': ['jpg'],

            //png
            '89504e': ['png'],

            //mp3
            'fffbb0': ['mp3'],

            //mp4
            '000000': ['mp4'],

            //xml, xslt, xsl
            'efbbbf': ['xml', 'xslt', 'xsl'],

            //docx, zip
            '504b34': ['docx', 'zip', 'xlsx', 'pptx'],

            //gz, tar.gz
            '1f8b80': ['gz', 'tar.gz'],

            //doc, xls, ppt, msg, msi
            'd0cf11': ['doc', 'xls', 'ppt', 'msg', 'msi', 'vsd'],

            //pdf
            '255044': ['pdf'],

            //exe
            '4d5a90': ['exe'],
        };

        this._magicByte = '';
    }

    /**
     * returns array of image file extensions
     *
     *@return {Array}
    */
    getImageMimes() {
        return ['gif', 'jpg', 'png'];
    }

    /**
     * returns array of audio file extensions
     *
     *@return {Array}
    */
    getAudioMimes() {
        return ['mp3'];
    }

    /**
     * returns array of video file extensions
     *
     *@return {Array}
    */
    getVideoMimes() {
        return ['movi', 'mp4', 'ogg', 'webm'];
    }

    /**
     * returns array of media file extensions
     *
     *@return {Array}
    */
    getMediaMimes() {
        return [
            ...this.getImageMimes(),
            ...this.getAudioMimes(),
            ...this.getVideoMimes()
        ];
    }

    /**
     * returns array of document file extensions
     *
     *@return {Array}
    */
    getDocumentMimes() {
        return ['pdf', 'doc', 'docx'];
    }

    /**
     * returns array of archive file extensions
     *
     *@return {Array}
    */
    getArchiveMimes() {
        return ['tar.gz', 'tar', 'zip'];
    }

    /**
     * returns the magic byte for the last file validation
     *
     *@returns {string}
    */
    getMagicByte() {
        return this._magicByte;
    }

    /**
     * resolves a given extension to something compatible with its internal extension
     *
     *@param {string} ext - the extension
     *@return {string}
    */
    resolveExtension(ext) {
        ext = Util.isString(ext)? ext.toLowerCase() : '';

        switch(ext) {
            case 'jpeg':
                return 'jpg';
        }
        return ext;
    }

    /**
     * resolves array of extensions
     *
     *@param {Array} exts - array of file extensions to resolve
     *@return {Array}
    */
    resolveExtensions(exts) {
        return Util.makeArray(exts).map(this.resolveExtension);
    }

    /**
     * detects and returns array of possible file extensions
     *
     *@param {string} fileName - the file absolute path
     *@throws {FileReadException}
     *@throws {FileNotFoundException}
     *@return {Array}
    */
    detect(fileName) {
        if (!fs.existsSync(fileName))
            throw new FileNotFoundException(fileName + ' does not exist');

        let fd = null,
            buffer = Buffer.alloc(4);
        try {
            fd = fs.openSync(fileName, 'r');
        }
        catch(ex) {
            throw new FileReadException(ex.message);
        }

        fs.readSync(fd, buffer, null, 4);
        this._magicByte = buffer.toString('hex').substring(0, 6);

        return Util.arrayValue(this._magicByte, this._extensions, ['txt']);
    }
}