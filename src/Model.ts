import { expandProperty } from '@forensic-js/utils';
import Handler from './Handler';
import { DefaultFields, Data } from './@types';

export default class Model<Fields extends string = DefaultFields, Exports = Data<Fields>> {

    private handler: Handler<Fields, Exports>

    private fieldsToSkip: string[] = [];

    private fieldsToRename: {[old: string]: string} = {};

    constructor(handler: Handler<Fields, Exports>) {
        this.handler = handler;
    }

    /**
     * list of fields to skip when exporting data
     * @param fields comma separated list of fields to skip
     */
    skipFields(...fields: string[]) {
        fields.forEach(field => this.fieldsToSkip.push(field));
        return this;
    }

    /**
     * rename a given given
     * @param oldName field old name
     * @param newName field new name
     */
    renameField(oldName: string, newName: string) {
        this.fieldsToRename[oldName] = newName;
        return this;
    }

    /**
     * renames the given fields
     * @param fields object of field old name to new name value pairs
     */
    renameFields(fields: {[oldName: string]: string}) {
        Object.keys(fields).forEach(oldName => this.fieldsToRename[oldName] = fields[oldName]);
        return this;
    }

    /**
     * exports the data to the given target
     * @param target
     */
    export<T>(target: T = {} as T): T & Exports {
        Object.keys(this.handler.data).forEach(field => {
            if (!this.fieldsToSkip.includes(field)) {
                const newName = this.fieldsToRename[field] || field;
                expandProperty(target as any as object, newName, this.handler.data[field], undefined, this.handler.getDBCaseStyle());
            }
        });
        return target as T & Exports;
    }
}