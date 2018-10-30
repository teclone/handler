import FileReadException from '../../src/Exceptions/FileReadException';
import Exception from '../../src/Exceptions/Exception';

describe('Exception Module', function() {
    let exception = null,
        message = '';
    beforeEach(function() {
        message = 'just testing exception';
        exception = new FileReadException(message);
    });

    describe('#constructor', function() {
        it(`should create a FileReadException instance`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(FileReadException);
                expect(ex.message).toEqual(message);
            }
        });

        it(`should inherit from Exception and Error class`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(Exception);
                expect(ex).toBeInstanceOf(Error);
            }
        });
    });
});