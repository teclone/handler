import mongoose from 'mongoose';

export const connect = function() {
    return new Promise((resolve) => {
        mongoose.connect('mongodb://localhost/test', {
            useNewUrlParser: true
        });
        mongoose.connection.once('open', function() {
            resolve();
        });
    });
};

export const closeConnection = function() {
    return new Promise((resolve) => {
        mongoose.connection.close(function() {
            resolve();
        });
    });
};