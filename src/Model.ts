import { expandProperty, applyCase } from '@teclone/utils';
import { Handler } from './Handler';
import { Data } from './@types';

export class Model<F extends string = string> {
  private handler: Handler<F>;

  private fieldsToSkip: { [p: string]: boolean } = {};

  private fieldsToRename: { [old: string]: string } = {};

  constructor(handler: Handler<F>) {
    this.handler = handler;
  }

  /**
   * list of fields to skip when exporting data
   * @param fields comma separated list of fields to skip
   */
  skipFields(...fields: F[]) {
    for (const field of fields) {
      this.fieldsToSkip[field] = true;
    }
    return this;
  }

  /**
   * rename a given given
   * @param oldName field old name
   * @param newName field new name
   */
  renameField(oldName: F, newName: F | string) {
    this.fieldsToRename[oldName] = newName;
    return this;
  }

  /**
   * renames the given fields
   * @param fields object of field old name to new name value pairs
   */
  renameFields(fields: Partial<{ [oldName in F]: F | string }>) {
    for (const oldName of Object.keys(fields)) {
      this.renameField(oldName as F, fields[oldName]);
    }
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

    for (const field of Object.keys(handler.data)) {
      if (typeof fieldsToSkip[field] !== 'undefined') {
        continue;
      }

      const value = handler.data[field];
      const name = fieldsToRename[field] || field;

      if (expandProperties) {
        expandProperty(
          target,
          name,
          value,
          undefined,
          handler.getDBCaseStyle()
        );
      } else {
        target[applyCase(name, handler.getDBCaseStyle())] = value;
      }
    }
    return target as T & Data<F>;
  }
}
