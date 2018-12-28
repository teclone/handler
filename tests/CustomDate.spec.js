import CustomDate from '../src/CustomDate';

describe('CustomDate', function() {

    describe('#constructor()', function() {
        it(`should inherit from the Date object`, function() {
            expect(new CustomDate()).toBeInstanceOf(CustomDate);
        });
    });

    describe('#toString()', function() {
        it(`should format in the form YYYY-MM-DD and return it`, function() {
            expect(new CustomDate() + '').toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/);
        });
    });

    describe('.isValid(year, month, day)', function() {
        it(`should return false if the given arguments is not a valid date`, function() {
            expect(CustomDate.isValid(1999, 1, 30)).toBeFalsy(); //february 30 1999
            expect(CustomDate.isValid(null)).toBeFalsy();
            expect(CustomDate.isValid(0, 0, 0)).toBeFalsy();
        });

        it(`should return true if the given arguments is a valid date`, function() {
            expect(CustomDate.isValid(1999, 1, 28)).toBeTruthy(); //february 28 1999
            expect(CustomDate.isValid(2020, 1, 29)).toBeTruthy();
        });
    });
});