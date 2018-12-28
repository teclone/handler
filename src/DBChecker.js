/**
 * db check rule options
 *@typedef {Object} DBCheckOptions
 *
 *@property {string|Object} [query] - custom select query string (for relational models) or
 * query object (for nosql models).
 *@property {Object} [model] - a model object such as mongoose model, to be used in carring out
 * the query.
 *@property {string} [entity] - database table or collection name. **Required if model & query
 * parameters are not defined.**
 *@property {string} [table] - alias for the entity parameter
 *@property {string} [collection] - alias for the entity parameter.
 *@property {string} [field] - defines the table or collection field to check on. Defaults to
 * current field name under validation. If db model is relational, and field value is an integer,
 * it will default to id
 *@property {Array} [params] - array of params to be used while running the query.
 * Applies mostly to relational database models
*/

import { DB_MODELS } from './Constants';
import MissingParameterException from './Exceptions/MissingParameterException';
import Regex from './Regex';
import Common from './Traits/Common';
import Util from './Util';

/**
 * database checker module
*/
export default class DBChecker extends Common {

    /**
     * the execute method carries out the execution. it should return an integer denoting
     * the query result count. the method can be asynchronous.
     *
     * Default implementation here supports mongoose models
     *
     *@protected
     *@param {string|Object} query - the query can be a string for relationals or object for
     * noSql scenerio.
     *@param {Array} params - array of parameters, applicable to relational database. defaults
     * to empty array
     *@param {DBCheckOptions} options - the db check options
     *@returns {Promise}
    */
    execute(query, params, options) {
        if (!options.model || typeof options.model.countDocuments === 'undefined')
            throw new MissingParameterException(
                'Mongoose model not found. Provide your own DB Checker if you are not using mongoose'
            );

        return options.model.countDocuments(query).exec();
    }

    /**
     * builds query from the given options. the options object contains
     * the following keys: params, entity (that is table or collection), field, and query
     *
     * if query is given, (which can be a string for relational or object for noSql)
     * then the other fields are not required except params for relational (defaults to empty array)
     *
     * if there is no query given, then an entity (table or collection) should be defined,
     * followed by the field to check on. Leave out the params option. if no field is given,
     * it defaults to fieldName for noSql, and defaults to id or fieldName for relational
     * depending on if the field value is an integer or not
     *
     *@protected
     *@param {DBCheckOptions} options - the database check options
     *@param {mixed} value - current field value under validation
     *@returns {string|Object}
    */
    buildQuery(options, value) {
        if (this._dbModel === DB_MODELS.NOSQL) {
            const result = {};
            result[options.field] = value;
            return result;
        }
        else {
            return `SELECT count(*) FROM ${options.entity} WHERE ${options.field} = ?`;
        }
    }

    /**
     * resolve query
     *
     *@protected
     *@param {string|Object} query - query string for relational or query object for nosql
     *@param {mixed} value - the current value
     *@return {string|Object}
    */
    resolveQuery(query, value) {
        if (Util.isPlainObject(query)) {
            for (let key of Object.keys(query)) {
                query[key] = this.resolveQuery(query[key], value);
            }
            return query;
        }

        if (Util.isArray(query)) {
            return query.map((current) => {
                return this.resolveQuery(current, value);
            });
        }

        return Regex.replaceCallback(/\{\s*([^}]+)\s*\}/, matches => {
            let resolved = matches[0],
                capture = matches[1].toLowerCase();

            switch(capture) {
                case 'this':
                    resolved = value;
                    break;
                case '_index':
                    resolved = value;
                    break;
            }
            return resolved;
        }, query);
    }

    /**
     * resolve parameters
     *
     *@protected
     *@param {Array} params - array of parameters
     *@param {mixed} value - the current value
     *@return {Array}
    */
    resolveParams(params, value) {

        return params.map(param => {
            return Regex.replaceCallback(/\{\s*([^}]+)\s*\}/, matches => {
                let resolved = matches[0],
                    capture = matches[1].toLowerCase();

                switch(capture) {
                    case 'this':
                        resolved = value;
                        break;
                    case '_index':
                        resolved = value;
                        break;
                }
                return resolved;
            }, param);
        });
    }

    /**
     * resets the db checker, and checks if the check call should proceed
     *
     *@protected
     *@return bool
    */
    setup(required, field, value, options, index) {
        this.reset(field, options, index);

        if (!required && (value === '' || value === null || value === undefined)) {
            this.shouldProceed(false);
        }
        else {
            this.shouldProceed(true);

            //resolve the params in the options array
            this._options.params = this.resolveParams(this._options.params, value);

            //resolve the query in the options array
            if (typeof this._options.query !== 'undefined')
                this._options.query = this.resolveQuery(this._options.query, value);
            else
                this._options.query = this.buildQuery(this._options, value);
        }

        return this.shouldProceed();
    }

    /**
     *@param {Object} errorBag - the error bag
     *@param {number} dbModel - the db model in use
    */
    constructor(errorBag, dbModel) {
        super(errorBag);
        this.setDBModel(dbModel);
    }

    /**
     * sets the db model
     *
     *@param {number} dbModel - the db model in use
    */
    setDBModel(dbModel) {
        this._dbModel = dbModel;
    }

    /**
     * check if a field exists, set error if it does
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {DBCheckOptions} options - database check options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    async checkIfExists(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            const count = await this.execute(options.query, options.params, options);
            if (count > 0) {
                this.setError(
                    Util.value('err', options, '{_this}:{this} already exists'),
                    value
                );
            }
        }
        return this.succeeds();
    }

    /**
     * check if a field does not exist, set error if it does not
     *
     *@param {boolean} required - boolean indicating if field is required
     *@param {string} field - field name
     *@param {mixed} value - field value
     *@param {DBCheckOptions} options - database check options
     *@param {number} index - current field value index
     *@returns {boolean}
    */
    async checkIfNotExists(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index))
        {
            const count = await this.execute(options.query, options.params, options);
            if (count === 0) {
                this.setError(
                    Util.value('err', options, '{_this}:{this} does not exist'),
                    value
                );
            }
        }
        return this.succeeds();
    }
}