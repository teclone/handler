import DBChecker from '../../src/DBChecker';
import mongoose from './connection';

const schema = new mongoose.Schema();

export default class extends DBChecker {
    constructor(errorBag, dbModel) {
        super(errorBag, dbModel);
    }

    /**
     * execute the select query
    */
    execute(query, params, options) {
        if(options.model) {
            return options.model.countDocuments(query).exec();
        }
        else {
            const model = mongoose.model(options.entity, schema);
            return model.countDocuments(query).exec();
        }
    }
}