import mongoose from './Helpers/connection';
import Handler from '../src/Handler';
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
});