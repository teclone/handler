import FileExtensionDetector from '../src/FileExtensionDetector';
import path from 'path';
import FileNotFoundException from '../src/Exceptions/FileNotFoundException';
import FileReadException from '../src/Exceptions/FileReadException';

describe('FileExtensionDetector module', function() {
    let detector = null,
        basePath = '';

    beforeEach(function() {
        detector = new FileExtensionDetector();
        basePath = path.join(__dirname, 'Helpers/Files/');
    });

    describe('#detect(fileName)', function() {
        it(`should read the file's first 8 bytes and return an array of containing its possible
            file extensions`, function() {
            expect(detector.detect(basePath + 'file1.jpg')).toEqual(['jpg']);
        });

        it(`should throw FileNotFoundException if the given file does not exist`, function() {
            expect(function() {
                detector.detect(basePath + 'unknown.txt');
            }).toThrowError(FileNotFoundException);
        });

        it(`should throw FileReadException if the given file can't be read from`, function() {
            expect(function() {
                detector.detect('/root');
            }).toThrowError(FileReadException);
        });
    });

    describe('#resolveExtension(ext)', function() {
        it(`should resolve the given extension and return the resolved value`, function() {
            expect(detector.resolveExtension('JPEG')).toEqual('jpg');
            expect(detector.resolveExtension(null)).toEqual('');
            expect(detector.resolveExtension('PNG')).toEqual('png');
        });
    });

    describe('#resolveExtensions(exts)', function() {
        it(`should resolve the given array of extensions and return an array of
            resolved extensions`, function() {
            expect(detector.resolveExtensions('JPEG')).toEqual(['jpg']);
            expect(detector.resolveExtensions(null)).toEqual(['']);
            expect(detector.resolveExtensions(['PNG', 'JPEG'])).toEqual(['png', 'jpg']);
        });
    });

    describe('#getArchiveMimes()', function() {
        it(`should return array of archive file mimes`, function() {
            expect(detector.getArchiveMimes()).toBeInstanceOf(Array);
        });
    });

    describe('#getDocumentMimes()', function() {
        it(`should return array of document file mimes`, function() {
            expect(detector.getDocumentMimes()).toBeInstanceOf(Array);
        });
    });

    describe('#getMediaMimes()', function() {
        it(`should return array of media file mimes`, function() {
            expect(detector.getMediaMimes()).toEqual([
                ...detector.getImageMimes(),
                ...detector.getAudioMimes(),
                ...detector.getVideoMimes()
            ]);
        });
    });

    describe('#getMagicByte()', function() {
        it(`should return the magic byte of the last detection performed`, function() {
            expect(detector.getMagicByte()).toEqual('');

            detector.detect(basePath + 'spoofed.png');
            expect(detector.getMagicByte()).not.toEqual('');
        });
    });
});