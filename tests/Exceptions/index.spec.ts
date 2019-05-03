import Exception from '../../src/Exceptions';

describe('Exception', function() {
    describe(`#constructor(message: string, domain: any = Exception)`, function() {
        it(`should create an Exception instance when called, setting the exception name as the
            given domain`, function() {
            const exception = new Exception('some error', Date);
            expect(exception).toBeInstanceOf(Exception);
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex.name).toEqual('Date');
            }
        });

        it(`should default the exception name to Exception if the domain name argument is not
            given`, function() {
            const exception = new Exception('some error');
            expect(exception).toBeInstanceOf(Exception);
            try {
                throw exception;
            }
            catch(ex) {
                expect(ex.name).toEqual('Exception');
            }
        });
    });
});