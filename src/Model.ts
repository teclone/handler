import { expandProperty, applyCase } from '@forensic-js/utils';
import Handler from './Handler';
import { Data } from './@types';

export default class Model<F extends string = string> {
  private handler: Handler<F>;

  private fieldsToSkip: string[] = [];

  private fieldsToRename: { [old: string]: string } = {};

  constructor(handler: Handler<F>) {
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
  renameFields(fields: { [oldName: string]: string }) {
    Object.keys(fields).forEach(
      oldName => (this.fieldsToRename[oldName] = fields[oldName])
    );
    return this;
  }

  /**
   * exports the data to the given target
   * @param target model to export data to
   * @param expandProperties boolean indicating if properties should be expanding
   */
  export<T extends object>(
    target: T = {} as T,
    expandProperties: boolean = true
  ): T & Data<F> {
    const { handler, fieldsToSkip, fieldsToRename } = this;
    Object.keys(handler.data).forEach(field => {
      if (!fieldsToSkip.includes(field)) {
        const newName = fieldsToRename[field] || field;
        const value = handler.data[field];

        if (expandProperties) {
          expandProperty(
            target,
            newName,
            value,
            undefined,
            handler.getDBCaseStyle()
          );
        } else {
          target[applyCase(newName, handler.getDBCaseStyle())] = value;
        }
      }
    });
    return target as T & Data<F>;
  }
}
