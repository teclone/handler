import Exception from '../../src/Exceptions/Exception';

describe('Exception Module', function() {
    let exception = null,
        message = '';
    beforeEach(function() {
        message = 'just testing exception';
        exception = new Exception(message);
    });

    describe('#constructor', function() {
        it(`should create an Exception instance`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(Exception);
                expect(ex.message).toEqual(message);
            }
        });

        it(`should inherit from Error class`, function() {
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex).toBeInstanceOf(Error);
            }
        });
    });
});