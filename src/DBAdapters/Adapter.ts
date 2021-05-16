import { applyCase, isCallable, isObject, pickValue } from '@teclone/utils';
import { DataType } from '../@types';
import {
  DBCheckType,
  ModelDBCheck,
  SingleDataValue,
} from '../@types/rules/BaseRule';
import { Common } from '../Common';
import type { Handler } from '../Handler';

export abstract class Adapter<F extends string = string> extends Common<F> {
  abstract itExists(model: any, query): Promise<boolean>;

  abstract itDoesNotExist(model: any, query): Promise<boolean>;

  protected errorConstants: {
    [p in DBCheckType]: string;
  } = {
    itExists: '{name}:{value} does not exist',
    itDoesNotExist: '{name}:{value} already exist',
  };

  protected dbCaseStyle: number;

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
   * executes the check
   * @param fieldType
   * @param field
   * @param value
   * @param index
   * @param check
   * @param handler
   */
  async execute(
    fieldType: DataType,
    field: F,
    value: SingleDataValue,
    index: number,
    check: ModelDBCheck<F>,
    handler: Handler<F>
  ) {
    this.reset(field, value, index);
    let query;

    if (isCallable(check.query)) {
      query = check.query(fieldType, field, value, index, handler);
    } else if (isObject(check.query)) {
      query = check.query;
    } else {
      let resolveField: string;
      if (check.field) {
        resolveField = check.field;
      } else {
        resolveField = applyCase(field, this.dbCaseStyle);
        switch (fieldType) {
          case 'objectId':
            resolveField = '_id';
            break;
        }
      }
      query = {
        [resolveField]: value,
      };
    }

    const { that: method } = check;

    if (!(await this[method](check.model, query))) {
      this.setError(
        pickValue(check, 'err', this.errorConstants[method]),
        value.toString()
      );
    }

    return this.succeeds();
  }
}
