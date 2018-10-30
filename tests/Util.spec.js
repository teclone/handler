import Util from '../src/Util';
describe('Util Module', function() {
    describe('.isString(variable)', function() {
        it('should return true if argument is of type string', function() {
            expect(Util.isString('')).toBeTruthy();
        });

        it('should return false if argument is not of type string', function() {
            expect(Util.isString({})).toBeFalsy();
            expect(Util.isString(2)).toBeFalsy();
        });
    });

    describe('isInt(variable)', function() {
        it(`should return true if argument is an integer`, function() {
            expect(Util.isInt('042')).toBeTruthy();
            expect(Util.isNumeric('+33')).toBeTruthy();
            expect(Util.isNumeric('-004aaaa')).toBeTruthy();
        });

        it(`should return false if argument is not an integer`, function() {
            expect(Util.isInt('-+000.4eeeee')).toBeFalsy();
            expect(Util.isInt('.eeeee')).toBeFalsy();
            expect(Util.isInt('add.4eeeee')).toBeFalsy();
        });
    });

    describe('isNumeric(variable)', function() {
        it(`should return true if argument is a numeric value`, function() {
            expect(Util.isNumeric('000.4eeeee')).toBeTruthy();
            expect(Util.isNumeric('.0004eeeee')).toBeTruthy();
            expect(Util.isNumeric('+33.4eeeee')).toBeTruthy();
            expect(Util.isNumeric('-33.4eeeee')).toBeTruthy();
        });

        it(`should return false if argument is not a numeric value`, function() {
            expect(Util.isNumeric('-+000.4eeeee')).toBeFalsy();
            expect(Util.isNumeric('.eeeee')).toBeFalsy();
            expect(Util.isNumeric('add.4eeeee')).toBeFalsy();
        });
    });

    describe('.isArray(variable)', function() {
        it('should return true if argument is an array', function() {
            expect(Util.isArray([])).toBeTruthy();
        });

        it('should return false if argument is not an array', function() {
            expect(Util.isArray({})).toBeFalsy();
            expect(Util.isArray('')).toBeFalsy();
        });
    });

    describe('.isCallable(variable)', function() {
        it('should return true if argument is a function', function() {
            expect(Util.isCallable(name => name)).toBeTruthy();
        });

        it('should return false if argument is not a function', function() {
            expect(Util.isCallable(new RegExp('a'))).toBeFalsy();
        });
    });

    describe('.isObject(variable)', function() {
        it('should return true if argument is an object', function() {
            expect(Util.isObject({})).toBeTruthy();
            expect(Util.isObject([])).toBeTruthy();
        });

        it('should return false if argument is not an object', function() {
            expect(Util.isObject('')).toBeFalsy();
            expect(Util.isObject(null)).toBeFalsy();
            expect(Util.isObject(undefined)).toBeFalsy();
        });
    });

    describe('.isPlainObject(variable)', function() {
        it('should return true if argument is a plain object', function() {
            expect(Util.isPlainObject({})).toBeTruthy();
            expect(Util.isPlainObject(Object.create(null))).toBeTruthy();
        });

        it('should return false if argument is not a plain object', function() {
            expect(Util.isPlainObject([])).toBeFalsy();
            expect(Util.isPlainObject(this)).toBeFalsy();
            expect(Util.isPlainObject('')).toBeFalsy();
        });
    });

    describe('isRegex(variable)', function() {
        it(`should return true if argument is a regex object`, function() {
            expect(Util.isRegex(/something/)).toBeTruthy();
            expect(Util.isRegex(new RegExp('^\\d+$'))).toBeTruthy();
        });

        it(`should return false if argument is not a regex object`, function() {
            expect(Util.isRegex('/something/')).toBeFalsy();
            expect(Util.isRegex({})).toBeFalsy();
        });
    });

    describe('.isValidParameter(variable, excludeNulls?)', function() {
        it('should return true if argument is a valid function parameter. a valid function parameter is a parameter that is defined', function() {
            expect(Util.isValidParameter(3.2)).toBeTruthy();
        });

        it('should return false if argument is not a valid function parameter. a valid function parameter is a parameter that is defined', function() {
            expect(Util.isValidParameter(undefined)).toBeFalsy();
        });

        it('should accept a second boolean argument indicating if null arguments should be taken as invalid', function() {
            expect(Util.isValidParameter(null, true)).toBeFalsy();
        });
    });
});