import Handler from '../src/Handler';
import mongoose from './Helpers/connection';
import DBChecker from './Helpers/DBChecker';

describe('DBChecker module', function() {

    let handler = null,
        model = null;

    beforeAll(function(done) {
        const schema = new mongoose.Schema({
            email: String,
            password: String
        });
        model = mongoose.model('User', schema);

        const userData = {
            email: 'harrisonifeanyichukwu@gmail.com',
            password: 'random_243',
        };
        model.create(userData).then(() => {
            done();
        });
    });

    afterAll(function(done) {
        model.deleteMany().exec().then(() => {
            done();
        });
    });

    beforeEach(function() {
        handler = new Handler;
        handler.setDBChecker(new DBChecker);
    });

    describe('#checkIfExists', function() {
        it(`should run the db check rule and set error if field exist`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@gmail.com',
            };
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toLower: true
                    },
                    check: {
                        if: 'exists',
                        model
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeFalsy();
            });
        });

        it(`should run the db check rule and validate to true if field does not exist`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@example.com',
            };
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toUpper: true
                    },
                    check: {
                        if: 'exists',
                        model
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeTruthy();
            });
        });
    });

    describe('#checkIfNotExists', function() {
        it(`should run the db check rule and set error if field does not exist`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@outlook.com',
            };
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toLower: true
                    },
                    check: {
                        if: 'notExists',
                        model,
                        field: 'email'
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeFalsy();
            });
        });

        it(`should run the db check rule and validate to true if field exists`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@gmail.com',
            };
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toLower: true
                    },
                    check: {
                        if: 'doesNotExist',
                        query: {
                            email: '{this}'
                        },
                        model
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeTruthy();
            });
        });
    });

    describe('check callbacks', function() {
        it(`should run the callback method and set error if callback returns true`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@outlook.com',
            };
            const callback = jest.fn(() => {
                return true;
            });
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toLower: true
                    },
                    check: {
                        callback,
                        params: 'nothing',
                        err: 'email is not known'
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeFalsy();
                expect(handler.errors.email).toEqual('email is not known');

                //the first argument passed to the callback should be the field name
                expect(callback.mock.calls[0][0]).toEqual('email');
                //second argument should be the field value
                expect(callback.mock.calls[0][1]).toEqual(source.email.toLowerCase());
                //third argument should be the data object
                expect(callback.mock.calls[0][2]).toEqual(handler.data);
                //then comes the params list
                expect(callback.mock.calls[0][3]).toEqual('nothing');
            });
        });

        it(`should run the callback method without setting error if the callback returns false`, function() {
            const source = {
                email: 'Harrisonifeanyichukwu@outlook.com',
            };
            const callback = jest.fn(() => {
                return false;
            });
            const rules = {
                email: {
                    type: 'email',
                    filters: {
                        toLower: true
                    },
                    check: {
                        callback,
                        params: 'nothing',
                        err: 'email is not known'
                    }
                }
            };

            return handler.setSource(source).setRules(rules).execute().then(result => {
                expect(result).toBeTruthy();
            });
        });
    });
});