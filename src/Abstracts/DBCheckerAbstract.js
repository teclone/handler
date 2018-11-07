/**
 * event initialization options.
 *@typedef {Object} DBCheckOptions
 *@property {string|Object} [query] - custom select query string for relationals or find object
 * for no sql.
 *@property {string} [entity] - a string denoting the table or collection to check on. This
 * option is required if there is no custom query defined
 *@property {string} [field] - defines the field to check on. This option is needed when there
 * is no custom query defined. it defaults to fieldName for noSql, and defaults to id or
 * fieldName for relational depending on if the field value is an integer or not
 *@property {Array} [params] - array of params to be used while running the query. This is needed
 * for relational databases if there is a custom query defined. it defaults to empty array
 * You should leave out this option if you did not define a custom query
*/

import Common from '../Traits/Common';
import Regex from '../Regex';
import Util from '../Util';
import { DB_MODELS } from '../Constants';

export default class DBCheckerAbstract extends Common {

    /**
     * the execute method carries out the execution. it should return an integer denoting
     * the count or results return by the select/find query.
     *
     * this method must execute asynchronisely
     *
     *@param {string|Object} query - the query can be a string for relationals or object for
     * noSql scenerio.
     *@param {Array} params - array of parameters, applicable to relational database. defaults
     * to empty array
     *@param {DBCheckOptions} options - the db check options
    */
    // async execute(query, params, options) {

    // }

    /**
     * calls the execute method with the appropriate parameters
    */
    runExecution() {
        return this.execute(this._query, this._options['params'], this._options);
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
     *@param {DBCheckOptions} options - the database check options
     *@param {mixed} value - current field value under validation
    */
    buildQuery(options, value) {
        if (this._dbModel === DB_MODELS.NOSQL) {
            const result = {};
            result[options.field] = value;
            return result;
        }

        return `SELECT count(*) FROM ${options.entity} WHERE ${options.field}=?`;
    }

    /**
     * resolve query
     *
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
     *@return bool
    */
    setup(required, field, value, options, index) {
        this.reset(field, options, index);

        if (!required && (value === '' || value === null || value === undefined)) {
            this.shouldProceed(false);
        }
        else
        {
            this.shouldProceed(true);

            //resolve the params in the options array
            this._options.params = this.resolveParams(this._options.params, value);

            //resolve the query in the options array
            if (typeof this._options.query !== 'undefined')
                this._options.query = this.resolveQuery(this._options.query, value);
            else
                this._options.query = this.buildQuery(this._options);
        }

        return this.shouldProceed();
    }

    /**
     *@param {Object} errorBag - the error bag
     *@param {int} dbModel - the db model in use
    */
    constructor(errorBag, dbModel) {
        super(errorBag);
        this.setDBModel(dbModel);
    }

    /**
     * sets the db model
     *@param {int} dbModel - the db model in use
    */
    setDBModel(dbModel) {
        this._dbModel = dbModel;
    }

    /**
     * check if a field exists, set error if it does
    */
    async checkIfExists(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index)) {
            let count = await this.execute(options.query, options.params, options);
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
    */
    async checkIfNotExists(required, field, value, options, index) {
        if (this.setup(required, field, value, options, index))
        {
            if (this.setup(required, field, value, options, index)) {
                let count = await this.execute(options.query, options.params, options);
                if (count === 0) {
                    this.setError(
                        Util.value('err', options, '{_this}:{this} does not exist'),
                        value
                    );
                }
            }
        }
        return this.succeeds();
    }
}