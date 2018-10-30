import InvalidParameterException from '../../src/Exceptions/InvalidParameterException';
import Exception from '../../src/Exceptions/Exception';

describe('Exception Module', function() {
    let exception = null,
        message = '';
    beforeEach(function() {
        message = 'just testing exception';
        exception = new InvalidParameterException(message);
    });

    describe('#constructor', function() {
        it(`should create an InvalidParameterException instance`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(InvalidParameterException);
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