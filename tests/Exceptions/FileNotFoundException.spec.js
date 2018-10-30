import FileNotFoundException from '../../src/Exceptions/FileNotFoundException';
import Exception from '../../src/Exceptions/Exception';

describe('Exception Module', function() {
    let exception = null,
        message = '';
    beforeEach(function() {
        message = 'just testing exception';
        exception = new FileNotFoundException(message);
    });

    describe('#constructor', function() {
        it(`should create a FileNotFoundException instance`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(FileNotFoundException);
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