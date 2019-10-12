import Handler from '../src/Handler';
import Validator from '../src/Validator';
import DataSourceNotSetException from '../src/Exceptions/DataSourceNotSetException';
import RulesNotSetException from '../src/Exceptions/RulesNotSetException';
import StateException from '../src/Exceptions/StateException';
import FilesSourceNotSetException from '../src/Exceptions/FilesSourceNotSetException';
import { Rules, DataSource, FilesSource, DataValue, FileEntryCollection } from '../src/@types';
import { range } from '@forensic-js/utils';
import CustomDate from '../src/CustomDate';
import { DateRule, NumberRule } from '../src/@types/rules/NumberRules';
import {
  createFile,
  createFileCollection,
  noSqlConnect,
  noSqlPopulate,
  noSqlDepopulate,
  noSqlDisconnect,
} from './helpers';
import DBChecker from '../src/DBChecker';
import NoSqlUser from './helpers/nosql/models/User';
import Model from '../src/Model';

class CustomValidator extends Validator {}

class CustomDBChecker extends DBChecker {}

describe('Handler Module', function() {
  let handler: Handler = null;

  beforeEach(function() {
    handler = new Handler();
  });

  describe('static setDBModel(dbModel: number)', function() {
    it(`should set the global database model to use for all created instances`, function() {
      expect(handler.getDBModel()).toEqual(Handler.DB_MODELS.NOSQL);
      Handler.setDBModel(Handler.DB_MODELS.RELATIONAL);
      handler = new Handler();
      expect(handler.getDBModel()).toEqual(Handler.DB_MODELS.RELATIONAL);

      Handler.setDBModel(Handler.DB_MODELS.NOSQL);
    });
  });

  describe('static setDBCaseStyle(dbModel: number)', function() {
    it(`should set the global database model case style to use for all created instances`, function() {
      expect(handler.getDBCaseStyle()).toEqual(Handler.DB_MODEL_CASE_STYLES.CAMEL_CASE);
      Handler.setDBCaseStyle(Handler.DB_MODEL_CASE_STYLES.SNAKE_CASE);
      handler = new Handler();
      expect(handler.getDBCaseStyle()).toEqual(Handler.DB_MODEL_CASE_STYLES.SNAKE_CASE);

      Handler.setDBCaseStyle(Handler.DB_MODEL_CASE_STYLES.CAMEL_CASE);
    });
  });

  describe(`#constructor<Fields = DefaultFields, Exports = Data<Fields>>(
        dataSource?: DataSource, filesSource?: FilesSource, rules?: Rules, validator?: Validator,
        dbChecker?: DBChecker)`, function() {
    it(`should create an instance with empty argument, defaulting the validator to the
            internal validator`, function() {
      expect(new Handler()).toBeInstanceOf(Handler);
    });

    it(`should use a custom validator if given`, function() {
      expect(new Handler({}, {}, {}, new CustomValidator())).toBeInstanceOf(Handler);
    });

    it(`should use a custom db checker if given`, function() {
      expect(new Handler({}, {}, {}, new CustomValidator(), new CustomDBChecker())).toBeInstanceOf(Handler);
    });
  });

  describe(`#setDataSource(dataSource?: DataSource): this`, function() {
    it(`should set the given data source if given, returning the this object`, function() {
      expect(handler.setDataSource({})).toEqual(handler);
    });
  });

  describe(`#setFilesSource(filesSource?: FilesSource): this`, function() {
    it(`should set the given files source if given, returning the this object`, function() {
      expect(handler.setFilesSource({})).toEqual(handler);
    });
  });

  describe(`#setRules(rules?: Rules<Fields>): this`, function() {
    it(`should set the given field rules if given, returning the this object`, function() {
      expect(handler.setRules({})).toEqual(handler);
    });
  });

  describe(`#setValidator(validator: Validator<Fields>): this`, function() {
    it(`should set the given validator as instance validator module, returning itself`, function() {
      expect(handler.setValidator(new CustomValidator())).toEqual(handler);
    });
  });

  describe(`#setDBChecker(dbChecker: DBChecker<Fields>): this`, function() {
    it(`should set the given database integrity checker as instance dbChecker module,
            returning itself`, function() {
      expect(handler.setDBChecker(new CustomDBChecker())).toEqual(handler);
    });
  });

  describe(`#setError(field: string, errorMessage: string | false): this`, function() {
    it(`should set the given error message for the given field name, returning the this object`, function() {
      expect(handler.setError('first-name', 'first name is not given')).toEqual(handler);
    });

    it(`should default error message to 'error occured' if passed in value is false`, function() {
      handler.setError('first-name', false);
      expect(handler.errors['first-name']).toEqual('error occured');
    });
  });

  describe('#setDBModel(dbModel: number)', function() {
    it(`should override the instance database model to use`, function() {
      expect(handler.getDBModel()).toEqual(Handler.DB_MODELS.NOSQL);

      handler.setDBModel(Handler.DB_MODELS.RELATIONAL);
      expect(handler.getDBModel()).toEqual(Handler.DB_MODELS.RELATIONAL);
    });
  });

  describe('#setDBCaseStyle(dbModel: number)', function() {
    it(`should override the instance database model case style to use`, function() {
      expect(handler.getDBCaseStyle()).toEqual(Handler.DB_MODEL_CASE_STYLES.CAMEL_CASE);
      handler.setDBCaseStyle(Handler.DB_MODEL_CASE_STYLES.SNAKE_CASE);
      expect(handler.getDBCaseStyle()).toEqual(Handler.DB_MODEL_CASE_STYLES.SNAKE_CASE);
    });
  });

  describe(`#getResolvedRules(): ResolvedRules<Fields>`, function() {
    it(`should return the resolved rules object`, function() {
      expect(handler.getResolvedRules()).toEqual({});
    });
  });

  describe(`#addField(field: string, value: DataValue)`, function() {
    it(`should add the given field to the data source and return this`, function() {
      expect(handler.addField('name', 'Harrison')).toEqual(handler);
    });
  });

  describe(`#addFields(fields: {[field: string]: DataValue})`, function() {
    it(`should add the given fields to the data source and return this`, function() {
      const fields = {
        name: 'Harrison',
      };
      expect(handler.addFields(fields)).toEqual(handler);
    });
  });

  describe(`async #execute(validateOnDemand: boolean = false, requredFields: string[] | string = '')`, function() {
    it(`should throw error if data source is not set`, async function(done) {
      const handler = new Handler();
      try {
        await handler.execute();
      } catch (ex) {
        expect(ex).toBeInstanceOf(DataSourceNotSetException);
        done();
      }
    });

    it(`should throw error if field rules is not set`, async function(done) {
      const handler = new Handler({});
      try {
        await handler.execute();
      } catch (ex) {
        expect(ex).toBeInstanceOf(RulesNotSetException);
        done();
      }
    });

    it(`should throw error if a handler instance is executed twice`, async function(done) {
      const handler = new Handler({}, undefined, {});
      await handler.execute();
      try {
        await handler.execute();
      } catch (ex) {
        expect(ex).toBeInstanceOf(StateException);
        done();
      }
    });

    it(`should throw error if a file field type is specified without supplying files source`, async function(done) {
      const handler = new Handler({}, undefined, {
        imageFile: 'image',
      });
      try {
        await handler.execute();
      } catch (ex) {
        expect(ex).toBeInstanceOf(FilesSourceNotSetException);
        done();
      }
    });
  });

  describe(`rule type resolution`, function() {
    it(`should resolve rule type, puting the type inside an object if it is specified as
        string`, function() {
      const handler = new Handler({}, undefined, {
        password: 'password',
      });
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.password.type).toEqual('password');
      });
    });

    it(`should resolve shouldMatch rule option, converting it to object if not given as object`, function() {
      const handler = new Handler<'password1' | 'password2'>({}, undefined, {
        password1: 'password',
        password2: {
          type: 'password',
          options: {
            shouldMatch: 'password1',
          },
        },
      });
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect((resolvedRules.password2.options.shouldMatch as any).target).toEqual('{password1}');
      });
    });

    it(`should resolve shouldMatch rule option, adding begining and enclosing brackets if not present`, function() {
      const handler = new Handler<'password1' | 'password2'>({}, undefined, {
        password1: 'password',
        password2: {
          type: 'password',
          options: {
            shouldMatch: {
              target: 'password1',
            },
          },
        },
      });
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect((resolvedRules.password2.options.shouldMatch as any).target).toEqual('{password1}');
      });
    });

    it(`should set checkbox rule type as optional`, function() {
      const handler = new Handler({}, undefined, {
        termsAndCondition: {
          type: 'checkbox',
        },
      });
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.termsAndCondition.required).toBeFalsy();
      });
    });
  });

  describe(`Placeholders resolution`, function() {
    it(`should resolve rules, replacing every occurence of {_this} with the field name`, function() {
      const handler = new Handler({}, undefined, {
        password: {
          type: 'password',
          hint: '{_this} is required',
        },
      });
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.password.hint).toEqual('password is required');
      });
    });

    it(`should resolve rules, replacing every occurence of {current_date} with current date string`, function() {
      const data = {
        date: '2018-01-01',
      };
      const rules: Rules<'date'> = {
        date: {
          type: 'date',
          hint: '{_this} is required',
          options: {
            gt: '{current_date}',
          },
        },
      };
      const handler = new Handler(data, null, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect((resolvedRules.date as DateRule<'date'>).options.gt).toEqual(new CustomDate() + '');
      });
    });

    it(`should resolve rules, replacing every occurence of {current_year} with current year string`, function() {
      const data = {
        year: '2018',
      };
      const rules: Rules<'year'> = {
        year: {
          type: 'int',
          options: {
            gt: '{current_year}',
          },
        },
      };
      const handler = new Handler(data, null, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect((resolvedRules.year as NumberRule<'year'>).options.gt).toEqual(new CustomDate().getFullYear() + '');
      });
    });

    it(`should resolve rules, replacing every occurence of {current_time} with current timestamp string`, function() {
      const data = {
        time: '201810101001',
      };
      const rules: Rules<'time'> = {
        time: {
          type: 'int',
          options: {
            gt: '{current_time}',
          },
        },
      };
      const handler = new Handler(data, null, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(Number.parseInt((resolvedRules.time as NumberRule<'time'>).options.gt as string)).toBeLessThanOrEqual(
          new CustomDate().getTime() * 1000
        );
      });
    });

    it(`should resolve rules, leaving values with no relevant placeholders untouched`, function() {
      const data = {
        time: '201810101001',
        country: 'Ng',
      };
      const rules: Rules<'time' | 'country'> = {
        time: {
          type: 'int',
          options: {
            gt: 2000,
          },
        },
        country: {
          type: 'choice',
          options: {
            choices: ['Ng', 'Fi', 'Pl'],
          },
        },
      };
      const handler = new Handler(data, null, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect((resolvedRules.time as NumberRule<'time' | 'country'>).options.gt).toEqual(2000);
      });
    });
  });

  describe(`requiredIf resolution`, function() {
    const countries = ['ng', 'fi', 'pl', 'fr', 'en'];
    const months = range(0, 11).map(value => value.toString());

    it(`should resolve the requiredIf notChecked rule, making field required if condition is met`, function() {
      const data = {
        isCurrentWork: 'false',
      };

      const rules: Rules<'isCurrentWork' | 'startMonth'> = {
        isCurrentWork: 'checkbox',

        startMonth: {
          type: 'choice',
          options: {
            choices: months,
          },
          requiredIf: {
            if: 'notChecked',
            field: 'isCurrentWork',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.startMonth.required).toBeTruthy();
      });
    });

    it(`should resolve the requiredIf checked rule, making field required if condition is met`, function() {
      const data = {
        subscribe: 'true',
      };
      const rules: Rules<'subscribe' | 'email'> = {
        subscribe: 'checkbox',

        email: {
          type: 'email',
          requiredIf: {
            if: 'checked',
            field: 'subscribe',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.email.required).toBeTruthy();
      });
    });

    it(`should resolve the requiredIf equals rule, making field required if condition is met`, function() {
      const data = {
        country: 'ng',
      };
      const rules: Rules<'country' | 'salary'> = {
        country: {
          type: 'choice',
          options: {
            choices: countries,
          },
        },

        /** tell us your salary demand if you are a nigerian */
        salary: {
          type: 'money',
          requiredIf: {
            if: 'equals',
            field: 'country',
            value: 'ng',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.salary.required).toBeTruthy();
      });
    });

    it(`should resolve the requiredIf notEquals rule, making field required if condition is met`, function() {
      const data = {
        country: 'pl',
      };
      const rules: Rules<'country' | 'salary'> = {
        country: {
          type: 'choice',
          options: {
            choices: countries,
          },
        },
        /** tell us your salary demand if you are not a nigerian */
        salary: {
          type: 'money',
          requiredIf: {
            if: 'notEquals',
            field: 'country',
            value: 'ng',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.salary.required).toBeTruthy();
      });
    });

    it(`should resolve the requiredIf in rule, making field required if condition is met`, function() {
      const data = {
        employmentTypes: ['1', '2', '3'],
      };
      const rules: Rules<'employmentTypes' | 'salary'> = {
        employmentTypes: {
          type: 'choice',
          filters: {
            toArray: true,
            toNumeric: true,
          },
          options: {
            choices: [1, 2, 3],
          },
        },

        /** tell us your salary demand if you are you choose full time employment type */
        salary: {
          type: 'money',
          requiredIf: {
            if: 'in',
            field: 'employmentTypes',
            value: 1,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.salary.required).toBeTruthy();
      });
    });

    it(`should resolve the requiredIf notIn rule, making field not required if condition is met`, function() {
      const data = {
        employmentTypes: ['1', '3'],
      };
      const rules: Rules<'employmentTypes' | 'salary'> = {
        employmentTypes: {
          type: 'choice',
          filters: {
            toNumeric: true,
          },
          options: {
            choices: [1, 2, 3],
          },
        },

        /** tell us your salary demand if you did not select contract work as your employment type */
        salary: {
          type: 'money',
          requiredIf: {
            if: 'notIn',
            field: 'employmentTypes',
            value: 2,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.salary.required).toBeTruthy();
      });
    });

    it(`should drop field value, overriding it with empty string if field has required if condition, but ended up not being required`, async function() {
      const data = {
        isCurrentWork: 'true',
        endMonth: '10',
      };
      const rules: Rules<'isCurrentWork' | 'endMonth'> = {
        isCurrentWork: 'checkbox',

        endMonth: {
          requiredIf: {
            if: 'notChecked',
            field: 'isCurrentWork',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      await handler.execute();

      expect(handler.data.endMonth).toEqual(null);
    });

    it(`should not drop field value, if drop option is explicitly set as false`, async function() {
      const data = {
        isCurrentWork: 'true',
        endMonth: '10',
      };
      const rules: Rules<'isCurrentWork' | 'endMonth'> = {
        isCurrentWork: 'checkbox',

        endMonth: {
          type: 'number',
          requiredIf: {
            if: 'notChecked',
            field: 'isCurrentWork',
            drop: false,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      await handler.execute();

      expect(handler.data.endMonth).toEqual(10);
    });
  });

  describe(`overrideIf resolution`, function() {
    it(`should resolve the overrideIf rule, overriding field value if condition is met`, function() {
      const data = {
        subscribe: 'false',
        email: 'someone@example.com',
      };

      const rules: Rules<'subscribe' | 'email'> = {
        subscribe: 'checkbox',

        email: {
          type: 'email',
          requiredIf: {
            if: 'checked',
            field: 'subscribe',
          },
          overrideIf: {
            if: 'notChecked',
            field: 'subscribe',
            with: '',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.email.required).toBeFalsy();
        expect(handler.data.email).toEqual(null);
      });
    });

    it(`should resolve the overrideIf rule, retaining field value if condition is not met`, function() {
      const data = {
        subscribe: 'true',
        email: 'someone@example.com',
      };

      const rules: Rules<'subscribe' | 'email'> = {
        subscribe: 'checkbox',

        email: {
          type: 'email',
          requiredIf: {
            if: 'checked',
            field: 'subscribe',
          },
          overrideIf: {
            if: 'notChecked',
            field: 'subscribe',
            with: '',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute().then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules.email.required).toBeTruthy();
        expect(handler.data.email).toEqual('someone@example.com');
      });
    });
  });

  describe(`Validate OnDemand Rule Filteration`, function() {
    it(`should filter rules, validating only fields that are sent, whose rules where defined`, function() {
      const files: FilesSource = {
        cv: createFile(),
      };

      const data: DataSource = {
        firstName: 'Harrison',
        email: 'example.com',
      };

      const rules: Rules<'firstName' | 'lastName' | 'email' | 'dateOfBirth' | 'cv'> = {
        firstName: 'text',
        lastName: 'text',
        email: 'email',
        dateOfBirth: 'date',
        cv: 'document',
      };

      const handler = new Handler(data, files, rules);
      return handler.execute(true).then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules).not.toHaveProperty('lastName');
        expect(resolvedRules).not.toHaveProperty('dateOfBirth');
      });
    });

    it(`should pick up rules for extra required fields even when there data are not sent`, function() {
      const rules: Rules<'firstName' | 'lastName' | 'email' | 'dateOfBirth'> = {
        firstName: 'text',
        lastName: 'text',
        email: 'email',
        dateOfBirth: 'date',
      };

      const data: DataSource = {
        email: 'example.com',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true, ['firstName', 'dateOfBirth']).then(() => {
        const resolvedRules = handler.getResolvedRules();
        expect(resolvedRules).toHaveProperty('firstName');
        expect(resolvedRules).toHaveProperty('dateOfBirth');
        expect(resolvedRules).not.toHaveProperty('lastName');
      });
    });
  });

  describe(`Data Filters`, function() {
    it(`should cast data values to boolean if rule type is either checkbox or boolean`, function() {
      const data: DataSource = {
        subscribe: 'false',
        'roles.isAdmin': '1',
      };
      const rules: Rules<'subscribe' | 'roles.isAdmin'> = {
        subscribe: 'checkbox',
        'roles.isAdmin': 'boolean',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.subscribe).toStrictEqual(false);
        expect(handler.data['roles.isAdmin']).toStrictEqual(true);
      });
    });

    it(`should decode data values by default unless the decode filter rule option is explicitly set to false`, function() {
      const name = 'Harrison Ifeanyichukwu';
      const encodedName = encodeURIComponent(name);

      const data: DataSource = {
        name1: encodedName,
        name2: encodedName,
        name3: encodedName,
      };

      const rules: Rules<'name1' | 'name2' | 'name3'> = {
        name1: 'text',
        name2: {
          filters: {
            decode: true,
          },
        },
        name3: {
          filters: {
            decode: false,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.name1).toStrictEqual(name);
        expect(handler.data.name2).toStrictEqual(name);
        expect(handler.data.name3).toStrictEqual(encodedName);
      });
    });

    it(`should strip out html tags by default unless the stripTags filter rule option is explicitly set to false`, function() {
      const name = 'Harrison Ifeanyichukwu';
      const text = `<p><i>${name}</i><br></p>`;

      const data: DataSource = {
        text1: text,
        text2: text,
        text3: text,
      };

      const rules: Rules<'text1' | 'text2' | 'text3'> = {
        text1: 'text',
        text2: {
          filters: {
            stripTags: true,
          },
        },
        text3: {
          filters: {
            stripTags: false,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.text1).toStrictEqual(name);
        expect(handler.data.text2).toStrictEqual(name);
        expect(handler.data.text3).toStrictEqual(text);
      });
    });

    it(`should not remove tags present in the user defined stripTagsIgnore filter options`, function() {
      const name = 'Harrison Ifeanyichukwu';
      const text = `<p><i>${name}</i><br></p>`;

      const data: DataSource = {
        text1: text,
      };

      const rules: Rules<'text1'> = {
        text1: {
          filters: {
            stripTags: true,
            stripTagsIgnore: 'p,<br>',
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.text1).toStrictEqual(`<p>${name}<br></p>`);
      });
    });

    it(`should trim and remove empty lines if the minimize filter option is set to true options`, function() {
      const text = `  This text enters new line
            which starts here`;

      const data: DataSource = {
        text1: text,
      };

      const rules: Rules<'text1'> = {
        text1: {
          filters: {
            minimize: true,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.text1).toStrictEqual(`This text enters new line which starts here`);
      });
    });

    it(`should trim texts by default unless the trim filter option is explicitly set to false`, function() {
      const text = `  My text       `;

      const data: DataSource = {
        text1: text,
        text2: text,
      };

      const rules: Rules<'text1' | 'text2'> = {
        text1: 'text',
        text2: {
          filters: {
            trim: false,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.text1).toStrictEqual(`My text`);
        expect(handler.data.text2).toStrictEqual(text);
      });
    });

    it(`should cast value to float if the toNumeric filter option is explicitly set to true,
            assigning 0 if value is not numeric`, function() {
      const numericText = '200AD';
      const nonNumericText = 'AD30';

      const data: DataSource = {
        num1: numericText,
        num2: nonNumericText,
      };

      const rules = {
        num1: {
          filters: {
            toNumeric: true,
          },
        },
        num2: {
          filters: {
            toNumeric: true,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.num1).toStrictEqual(200);
        expect(handler.data.num2).toStrictEqual(0);
      });
    });

    it(`should transform values to upper case if the toUpper filter option is explicitly set to true`, function() {
      const names = ['jack', 'jane', 'janet', 'julius'];

      const data: DataSource = {
        names,
      };

      const rules: Rules<'names'> = {
        names: {
          filters: {
            toUpper: true,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.names).toEqual(names.map(name => name.toUpperCase()));
      });
    });

    it(`should transform values to lowercase case if the toLower filter option is explicitly set to true`, function() {
      const names = ['jack', 'jane', 'janet', 'julius'];

      const data: DataSource = {
        names: names.map(name => name.toUpperCase()),
      };

      const rules: Rules<'names'> = {
        names: {
          filters: {
            toLower: true,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.names).toEqual(names);
      });
    });

    it(`should capitalize values if the capitalize filter option is explicitly set to true`, function() {
      const names = ['jack', 'jane', 'janet', 'julius'];

      const data: DataSource = {
        names: names.map(name => name.toUpperCase()),
      };

      const rules: Rules<'names'> = {
        names: {
          filters: {
            capitalize: true,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.names).toEqual(
          names.map(name => name.charAt(0).toUpperCase() + name.substring(1).toLowerCase())
        );
      });
    });

    it(`should sanitize/remove disallowed characters if field type is email`, function() {
      const email = '(someone@example.com)';

      const data: DataSource = {
        email,
      };

      const rules: Rules<'email'> = {
        email: 'email',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.email).toEqual('someone@example.com');
      });
    });

    it(`should sanitize/remove disallowed characters if field type is url`, function() {
      const url = 'http://www.example<>.com';

      const data: DataSource = {
        url,
      };

      const rules: Rules<'url'> = {
        url: 'url',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.url).toEqual('http://www.example.com');
      });
    });

    it(`should cast value to integer if field type is int, pInt or nInt, and value is
            numeric`, function() {
      const numericValue = '-20ad';
      const nonNumericValue = 'ad-20';

      const data: DataSource = {
        num1: numericValue,
        num2: numericValue,
        num3: numericValue,
        num4: nonNumericValue,
      };

      const rules: Rules<'num1' | 'num2' | 'num3' | 'num4'> = {
        num1: 'int',
        num2: 'pInt',
        num3: 'nInt',
        num4: 'int',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.num1).toEqual(-20);
        expect(handler.data.num2).toEqual(-20);
        expect(handler.data.num3).toEqual(-20);
        expect(handler.data.num4).toEqual('ad-20');
      });
    });

    it(`should cast value to float if field type is number, pNumber or nNumber, and value is
            numeric`, function() {
      const numericValue = '-20.2ad';
      const nonNumericValue = 'ad-20.2';

      const data: DataSource = {
        num1: numericValue,
        num2: numericValue,
        num3: numericValue,
        num4: nonNumericValue,
      };

      const rules: Rules<'num1' | 'num2' | 'num3' | 'num4'> = {
        num1: 'number',
        num2: 'pNumber',
        num3: 'nNumber',
        num4: 'number',
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.num1).toEqual(-20.2);
        expect(handler.data.num2).toEqual(-20.2);
        expect(handler.data.num3).toEqual(-20.2);
        expect(handler.data.num4).toEqual('ad-20.2');
      });
    });

    it(`should call the given filter callback if defined, passing in the value as the only argument
        to the callback`, function() {
      const callback = jest.fn(value => value.toUpperCase());

      const data: DataSource = {
        text: 'abcd',
      };

      const rules: Rules<'text'> = {
        text: {
          filters: {
            callback,
          },
        },
      };

      const handler = new Handler(data, undefined, rules);
      return handler.execute(true).then(() => {
        expect(callback.mock.calls[0][0]).toEqual('abcd');
        expect(handler.data.text).toEqual('ABCD');
      });
    });

    it(`should convert value to array if toArray filter option is set to true`, function() {
      const callback = jest.fn(value => value.toUpperCase());

      const data: DataSource = {
        text: 'abcd',
      };

      const rules: Rules<'text' | 'file'> = {
        text: {
          filters: {
            toArray: true,
          },
        },
        file: {
          type: 'document',
          filters: {
            toArray: true,
          },
        },
      };

      const file = createFile();

      const handler = new Handler(data, { file }, rules);
      return handler.execute(true).then(() => {
        expect(handler.data.text).toEqual(['abcd']);
        expect((handler.data.file as FileEntryCollection).name).toEqual([file.name]);
      });
    });
  });

  describe('Missing fields', function() {
    it(`should detect all missing fields before proceeding to validations`, function() {
      const data = {
        languages: [],
        firstName: '',
        email: 'someone@example.com',
      };

      const files: FilesSource = {};

      const rules: Rules<'languages' | 'firstName' | 'email' | 'image'> = {
        languages: 'text',
        firstName: 'text',
        email: 'email',
        image: 'image',
      };

      const handler = new Handler(data, files, rules);
      return handler.execute().then(status => {
        expect(status).toBeFalsy();
        expect(handler.errors).toHaveProperty('firstName');
        expect(handler.errors).toHaveProperty('languages');
        expect(handler.errors).toHaveProperty('image');
        expect(handler.errors).not.toHaveProperty('email');
      });
    });
  });

  describe('Optional fields & Default values', function() {
    it(`should not flag fields as missing if they are declared optional`, function() {
      const data = {
        phoneNumber: '+2348132083437',
        languages: ['fr', 'en-US', 'en-UK'],
        firstName: '',
      };

      const files: FilesSource = {};

      const rules: Rules<'languages' | 'firstName' | 'image' | 'phoneNumber'> = {
        languages: 'text',
        phoneNumber: 'phoneNumber',
        firstName: {
          required: false,
        },
        image: {
          type: 'image',
          required: false,
        },
      };

      const handler = new Handler(data, files, rules);
      return handler.execute().then(status => {
        expect(status).toBeTruthy();
        expect(handler.errors).not.toHaveProperty('firstName');
        expect(handler.errors).not.toHaveProperty('image');
      });
    });

    it(`should set the value of missing optional fields with the defaultValue option if
        given`, function() {
      const data = {
        languages: [],
        firstName: '',
      };

      const files: FilesSource = {
        cv: createFile(),
        cvs: createFileCollection(),
      };

      const rules: Rules<'languages' | 'firstName' | 'image' | 'cv' | 'cvs'> = {
        languages: {
          defaultValue: ['english'],
        },
        firstName: {
          defaultValue: 'Mustermann',
        },
        image: {
          type: 'document',
          defaultValue: createFile(),
        },
        cv: 'document',
        cvs: 'document',
      };

      const handler = new Handler(data, files, rules);
      return handler.execute().then(status => {
        expect(status).toBeTruthy();
      });
    });
  });

  describe(`Database checks`, function() {
    beforeEach(async function() {
      await noSqlConnect();
      await noSqlPopulate();
    });

    afterEach(async function() {
      await noSqlDepopulate();
      await noSqlDisconnect();
    });

    it(`should carry out database checks on fields if all validations succeeds`, async function() {
      handler.setDataSource({
        firstName: 'Harrison',
        email: 'someone30@example.com',
      });

      handler.setRules({
        firstName: {
          checks: {
            if: 'exists',
            model: NoSqlUser,
            err: '{this} already exists',
          },
        },
        email: {
          checks: {
            if: 'exists',
            model: NoSqlUser,
            err: 'email address already exists',
          },
        },
      });

      return handler.execute().then(status => {
        expect(status).toBeFalsy();
        expect(handler.errors.firstName).toEqual('"Harrison" already exists');
      });
    });

    it(`should carry out database check calling the given async callback, it should pass
        in the field name, field value and field index`, async function() {
      handler.setDataSource({
        firstName: 'Harrison',
        email: 'someone30@example.com',
      });

      const callback = jest.fn(async () => true);
      handler.setRules({
        firstName: {
          checks: {
            if: 'exists',
            callback,
          },
        },
        email: {
          checks: {
            if: 'exists',
            callback: async () => false,
          },
        },
      });

      return handler.execute().then(status => {
        expect(status).toBeFalsy();
        expect(handler.errors.firstName).toEqual('condition not satisfied');
      });
    });
  });

  describe(`Post processes`, function() {
    describe(`postValidate`, function() {
      it(`should call the postValidate callback, passing in field value, and data object as
            second parameter. It should validate as true if the async callback resolves to true`, function() {
        const dataSource: DataSource = {
          firstName: 'Harrison',
          email: 'someone@example.com',
        };
        const rules: Rules<'firstName' | 'email'> = {
          firstName: {
            postValidate: jest.fn((value, data) => {
              return Promise.resolve(value === data.email ? true : 'error');
            }),
          },
          email: {
            type: 'email',

            postValidate: jest.fn((value, data) => {
              return Promise.resolve(value === data.email ? true : 'error');
            }),
          },
        };
        const handler = new Handler(dataSource, {}, rules);
        return handler.execute().then(() => {
          expect(handler.errors.firstName).toEqual('error');
          expect(handler.errors.email).toBeUndefined();
        });
      });
    });

    describe(`postCompute`, function() {
      it(`should call the postCompute callback if defined, after all validations
                has succeeded`, function() {
        const dataSource: DataSource = {
          phoneNumber: '08132083437',
          firstName: 'Harrison',
          email: 'someone@example.com',
        };
        const rules: Rules<'firstName' | 'email' | 'phoneNumber'> = {
          firstName: 'text',
          phoneNumber: {
            type: 'phoneNumber',
            options: {
              country: 'ng',
            },
            postCompute: jest.fn((value: DataValue) => value),
          },
          email: {
            postCompute: jest.fn((value: DataValue) => Promise.resolve(value.toString().toUpperCase())),
          },
        };
        const handler = new Handler(dataSource, {}, rules);
        return handler.execute().then(() => {
          expect(handler.data.email).toEqual('SOMEONE@EXAMPLE.COM');
        });
      });
    });
  });

  describe(`#succeeds()`, function() {
    it(`should return true if the handler has been executed and was successful`, function() {
      const handler = new Handler({}, {}, {});
      expect(handler.succeeds()).toBeFalsy();
    });
  });

  describe(`#fails()`, function() {
    it(`should return true if the handler has not been executed and or its execution was unsuccessful`, function() {
      const handler = new Handler({}, {}, {});
      expect(handler.fails()).toBeTruthy();
    });
  });

  describe(`#model(): Model<Fields, Exports>`, function() {
    it(`should create a model instance and return it`, function() {
      const handler = new Handler({}, {}, {});
      expect(handler.model()).toBeInstanceOf(Model);
    });
  });

  describe(`#setCustomData(name: string, value: any)`, function() {
    it(`should set custom data when called`, function() {
      const handler = new Handler({}, {}, {});
      handler.setCustomData('name', 'name-value');
      expect(handler.getCustomData('name')).toEqual('name-value');
    });
  });
});
