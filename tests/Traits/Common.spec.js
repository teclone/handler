import Common from '../../src/Traits/Common';

describe('Common Traits module', function() {
    let common = null;

    beforeEach(function() {
        common = new Common();
    });

    describe('#constructor(errorBag)', function() {
        it(`should create an instance of Common and initialize the internal properties`, function() {
            expect(common).toBeInstanceOf(Common);

            expect(common.getErrorBag()).toEqual({});
        });

        it(`should initialize the errorBag with the given error bag object`, function() {
            let errorBag = {firstName: 'First name is not valid'},
                instance = new Common(errorBag);

            expect(instance.getErrorBag()).toStrictEqual(errorBag);
        });
    });

    describe('#reset(field, options, index)', function() {
        it(`should reset the instance state with the given options, defaulting
            index to 0 if not given`, function() {
            expect(common._field).toEqual('');
            expect(common._index).toEqual(0);

            common.reset('firstName', {}, 2);
            expect(common._index).toEqual(2);
            expect(common._field).toEqual('firstName');

        });
    });

    describe('#shouldProceed(status?)', function() {
        it(`should set the should proceed internal state of the instance if status is given,
            and return the current state`, function() {
            expect(common.shouldProceed()).toBeTruthy();
            expect(common.shouldProceed(false)).toBeFalsy();

            expect(common.shouldProceed(true)).toBeTruthy();
        });
    });

    describe('#setErrorBag(errorBag)', function() {
        it(`should set the given error bag object`, function() {
            let errorBag = {key: 'err'};
            common.setErrorBag(errorBag);
            expect(common.getErrorBag()).toStrictEqual(errorBag);
        });

        it(`should do nothing if argument is not a plain object`, function() {
            let errorBag = {key: 'err'};
            common.setErrorBag(errorBag);
            expect(common.getErrorBag()).toStrictEqual(errorBag);

            common.setErrorBag(null);
            expect(common.getErrorBag()).toStrictEqual(errorBag);
        });
    });

    describe('#setError(err, value)', function() {
        it(`should set the given error message on the instance for the current key`, function() {
            let errorBag = {},
                instance = new Common(errorBag);

            instance.reset('fav-number', {});
            instance.setError('"22" is not a valid field number', 22);
            expect(instance.getError('fav-number')).toEqual('"22" is not a valid field number');
        });

        it(`should resolve and replace {this} placeholder if it exists on the
            error message with the current field value under validation`, function() {
            let errorBag = {},
                instance = new Common(errorBag);

            instance.reset('fav-number', {});
            instance.setError('{this} is not a valid field number', 22);
            expect(instance.getError('fav-number')).toEqual('22 is not a valid field number');
        });

        it(`should resolve and replace {_this} placeholder if it exist on the
            error message with the current field name under validation`, function() {
            let errorBag = {},
                instance = new Common(errorBag);

            instance.reset('firstName', {});
            instance.setError('{_this} field is required', '');
            expect(instance.getError('firstName')).toEqual('firstName field is required');
        });

        it(`should resolve and replace {_index} placeholder if it exists on the
            error message with the current field name under validation`, function() {
            let errorBag = {},
                instance = new Common(errorBag);

            instance.reset('fav-colors', {});
            instance.setError('color {_index} is not a valid color', 'wrong-color');
            expect(instance.getError('fav-colors')).toEqual('color 1 is not a valid color');
        });
    });

    describe('#getError(field)', function() {
        it(`should return undefined if there is no error set for the given key`, function() {
            expect(common.getError('name')).toBeUndefined();
        });

        it(`should return an arbitrary error if there are errors but no field key is given`, function() {
            let instance = new Common({
                firstName: 'first name field is required',
                age: 'tell us your age'
            });
            expect([
                'first name field is required',
                'tell us your age',
            ]).toContain(instance.getError());
        });
    });

    describe('#succeeds()', function() {
        it(`should return boolean indicating if the last validation succeeded`, function() {
            expect(common.succeeds()).toBeTruthy();

            common.setError('key', 'error');
            expect(common.succeeds()).toBeFalsy();
        });
    });

    describe('#fails()', function() {
        it(`should return boolean indicating if the last validation failed`, function() {
            expect(common.fails()).toBeFalsy();

            common.setError('key', 'error');
            expect(common.fails()).toBeTruthy();
        });
    });
});