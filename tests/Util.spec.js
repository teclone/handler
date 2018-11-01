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

    describe('.makeArray(arg, excludeNulls?)', function() {
        it('should create and return an array using the supplied argument', function() {
            expect(Util.makeArray(2)).toEqual([2]);
        });

        it('should return the argument if it is already an array', function() {
            let arg = [];
            expect(Util.makeArray(arg)).toStrictEqual(arg);
        });

        it('should return empty array if argument is not a valid parameter. i.e, if argument is undefined', function() {
            expect(Util.makeArray(undefined)).toEqual([]);
        });
    });

    describe('.value(keys, object, defaultValue=undefined)', function() {
        let object = null;
        beforeEach(function() {
            object = {name: 'Harrison', age: 22};
        });

        it(`should return the value for the first key that exists in the object`, function() {
            expect(Util.value(['firstName', 'name'], object)).toEqual('Harrison');
        });

        it(`should return the default value if none of the keys exists
            in the object or if argument two is not an object`, function() {
            expect(Util.value('height', object)).toBe.undefined;
            expect(Util.value('height', object, '5ft')).toEqual('5ft');
            expect(Util.value('height', null, '5ft')).toEqual('5ft');
        });
    });

    describe('.objectValue(keys, object, defaultValue={})', function() {
        let object = null;
        beforeEach(function() {
            object = {name: 'Harrison', age: 22, academics: {
                school: 'Federal University of Technology Owerri',
                dept: 'Petroleum Engineering'
            }};
        });

        it(`should return the value for the first key that exists in the object whose value
            is in turn an object`, function() {
            expect(Util.objectValue(['name', 'academics'], object))
                .toHaveProperty('dept', 'Petroleum Engineering');
        });

        it(`should return the default value if none of the keys exists
            or contains an object value or if argument two is not an object`, function() {
            expect(Util.objectValue('height', object)).toEqual({});
            expect(Util.objectValue('height', null, {value: '5ft'}))
                .toHaveProperty('value', '5ft');
        });
    });

    describe('.arrayValue(keys, object, defaultValue=[])', function() {
        let object = null;
        beforeEach(function() {
            object = {name: 'Harrison', age: 22, favoriteNumbers: [
                4, 6, 9, 10
            ]};
        });

        it(`should return the value for the first key that exists in the object whose value
            is an array`, function() {
            expect(Util.arrayValue('favoriteNumbers', object))
                .toContain(10);
            expect(Util.arrayValue(['name', 'favoriteNumbers'], object))
                .toContain(4);
        });

        it(`should return the default value if none of the keys exists
            or contains an array value or if argument two is not an object`, function() {
            expect(Util.arrayValue('height', object)).toEqual([]);
            expect(Util.arrayValue('heights', null, ['5ft']))
                .toEqual(['5ft']);
        });
    });

    describe('.deleteFromObject(keys, object)', function() {
        it(`should delete all the given keys from the given object if they exists`, function() {
            let object = {name: 'some names', 'detail': 'some details'};

            Util.deleteFromObject('name', object);
            expect(object.name).not.toBeDefined();
        });

        it(`should do nothing if argument is not an object`, function() {
            expect(function() {
                Util.deleteFromObject('name', []);
            }).not.toThrow();
        });
    });

    describe('.keyNotSetOrTrue(key, object)', function() {
        let object = null;
        beforeEach(function() {
            object = {eatPizza: true, flyToGermany: 0};
        });

        it(`should return true if the given key is not defined in the object or if it is
            defined and it is truthy`, function() {
            expect(Util.keyNotSetOrTrue('eatPizza', object)).toBeTruthy();
            expect(Util.keyNotSetOrTrue('eatCake', object)).toBeTruthy();
        });

        it(`should return false if the given key is defined in the object and it is
            falsy`, function() {
            expect(Util.keyNotSetOrTrue('flyToGermany', object)).toBeFalsy();
        });

        it(`should return false if argument two is not an object`, function() {
            expect(Util.keyNotSetOrTrue('eatPizza', null)).toBeFalsy();
        });
    });

    describe('.keySetAndTrue(key, object)', function() {
        let object = null;
        beforeEach(function() {
            object = {eatPizza: true, flyToGermany: 0, speakGerman: 1};
        });

        it(`should return true if the given key is defined in the object
            and it is truthy`, function() {
            expect(Util.keySetAndTrue('eatPizza', object)).toBeTruthy();
            expect(Util.keySetAndTrue('speakGerman', object)).toBeTruthy();
        });

        it(`should return false if the given key is not defined in the object or its value is
            falsy`, function() {
            expect(Util.keySetAndTrue('flyToGermany', object)).toBeFalsy();
        });

        it(`should return false if argument two is not an object`, function() {
            expect(Util.keySetAndTrue('eatPizza', null)).toBeFalsy();
        });
    });

    describe('.range(from, to, step=1)', function() {
        it(`should create and return an array containing a range of number values starting from the
            first argument, incrementing according to the step argument, and stoping at the
            second argument`, function() {
            expect(Util.range(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

            expect(Util.range(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10]);

            expect(Util.range(0, 10, 0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it(`should create and return an array containing a range of alphabets starting from the
            first argument, incrementing according to the step argument, and stoping at the
            second argument`, function() {
            expect(Util.range('a', 'd')).toEqual(['a', 'b', 'c', 'd']);
            expect(Util.range('A', 'D')).toEqual(['A', 'B', 'C', 'D']);

            expect(Util.range('X', ',')).toEqual(['X', 'Y', 'Z']);
        });

        it(`should return empty array if argument is not valid number or alphabets`, function() {
            expect(Util.range(',', 'd')).toEqual([]);
            expect(Util.range()).toEqual([]);
        });
    });

    describe('.padZeros(value, finalLength=2)', function() {
        it(`should left pad the given string or number value with zeros until its length
            equals the finalLength`, function() {
            expect(Util.padZeros(3, 3)).toEqual('003');
        });

        it(`should return empty string if argument is neither a string nor a number`, function() {
            expect(Util.padZeros({})).toEqual('');
        });
    });

    describe('.composeIntoObject(object, keys, value)', function() {
        it(`should compose and assign the value for the given key into the object`, function() {
            expect(Util.composeIntoObject(null, 'details.address.lga', 'udenu')).toEqual({
                details: {
                    address: {
                        lga: 'udenu'
                    }
                }
            });
        });

        it(`should compose and assign the value for the given key into the object without
            destroying data`, function() {
            let data = {
                details: {
                    address: {
                        lga: 'udenu'
                    }
                }
            };
            expect(Util.composeIntoObject(data, 'details.info.name', 'Harrison')).toEqual({
                details: {
                    address: {
                        lga: 'udenu'
                    },
                    info: {
                        name: 'Harrison'
                    }
                }
            });
        });
    });
});