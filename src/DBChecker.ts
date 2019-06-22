import Common from './Common';
import {DataValue, ModelDBCheck} from './@types';
import { DB_MODELS } from './Constants';
import { pickValue, applyCase } from '@forensic-js/utils';

export default class DBChecker<F extends string = string> extends Common<F> {

    private dbModel: number;
    private dbCaseStyle: number;
    private query: object = {};

    /**
     * executes the query
     */
    protected execute(model: any, query: object) {
        if (this.dbModel === DB_MODELS.NOSQL) {
            return model.countDocuments(query).exec();
        }
        else {
            return model.count({where: query});
        }
    }

    /**
     * resets the db checker, and checks if the check call should proceed
     */
    protected setup(required: boolean, field: string, value: DataValue, check: ModelDBCheck, index: number) {
        this.reset(field, check, index);

        if (value === '' && !required) {
            this.shouldProceed = false;
        }
        else {
            this.shouldProceed = true;
            if (check.query) {
                this.query = check.query;
            }
            else {
                this.query = {
                    [applyCase(check.field || field, this.dbCaseStyle)]: value
                };
            }
        }
        return this.shouldProceed;
    }

    /**
     * sets db model to use
     *
     * @param dbModel db model to use
     */
    setDBModel(dbModel: number) {
        this.dbModel = dbModel;
        return this;
    }

    /**
     * sets db model field case style to use
     *
     * @param dbModel db model case style to use
     */
    setDBCaseStyle(dbCaseStyle: number) {
        this.dbCaseStyle = dbCaseStyle;
        return this;
    }

    /**
     * checks if database field value exists, setting error if it does
     *
     * @param required boolean indicating if field is required
     * @param field current field under check
     * @param value current field value under check
     * @param check check options
     * @param index current field value index under check
     */
    async checkIfExists(required: boolean, field: string, value: DataValue, check: ModelDBCheck,
        index: number) {
        if (this.setup(required, field, value, check, index)) {
            const count = await this.execute(check.model, this.query);
            if (count > 0) {
                this.setError(
                    pickValue('err', check, '{_this}:{this} already exists'),
                    value.toString()
                );
            }
        }
        return this.succeeds();
    }

    /**
     * checks if database field value does not exist, setting error if it does not
     *
     * @param required boolean indicating if field is required
     * @param field current field under check
     * @param value current field value under check
     * @param check check options
     * @param index current field value index under check
     */
    async checkIfNotExists(required: boolean, field: string, value: DataValue, check: ModelDBCheck,
        index: number) {
        if (this.setup(required, field, value, check, index)) {
            const count = await this.execute(check.model, this.query);
            if (count === 0) {
                this.setError(
                    pickValue('err', check, '{_this}:{this} does not exist'),
                    value.toString()
                );
            }
        }
        return this.succeeds();
    }
}