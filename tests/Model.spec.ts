import Model from '../src/Model';
import Handler from '../src/Handler';

declare interface Fields {
  firstName: string;
  last_name: string;
  'middle-name': string;
  email: string;
  'roles.admin': boolean;
  'roles.user': boolean;
  'roles.owner': boolean;
}

declare interface Data extends Fields {
  roles: object;
}

describe('Model', function() {
  const dataSource = {
    firstName: 'Harrison',
    last_name: 'Ifeanyichukwu',
    'middle-name': 'Onuorah',
    email: 'someone@example.com',
    'roles.admin': 'false',
    'roles.user': 'true',
    'roles.owner': 'false',
  };
  let handler = new Handler(dataSource, null, {
    firstName: 'text',
    last_name: 'text',
    'middle-name': 'text',
    email: 'email',
    'roles.admin': 'boolean',
    'roles.user': 'boolean',
    'roles.owner': 'boolean',
  });
  let model: Model = handler.model();

  beforeEach(function() {
    handler = new Handler(dataSource, null, {
      firstName: 'text',
      last_name: 'text',
      'middle-name': 'text',
      email: 'email',
      'roles.admin': 'boolean',
      'roles.user': 'boolean',
      'roles.owner': 'boolean',
    });
    return handler.execute().then(() => {
      model = handler.model();
    });
  });

  describe(`#constructor(handler: Handler)`, function() {
    it(`should create a Model instance when called`, function() {
      expect(model).toBeInstanceOf(Model);
    });
  });

  describe(`#export(target: object = {}): target`, function() {
    it(`should export all data into the given target object, expanding properties along the
        line and returns the result`, function() {
      const result = model.export();
      expect(result).toHaveProperty('firstName', 'Harrison');
      expect(result.roles).toEqual({
        admin: false,
        user: true,
        owner: false,
      });
    });
  });

  describe(`#export<T extends object>(target: T = {}, expandProperties: boolean = true): target`, function() {
    it(`should export all data into the given target object, expanding properties along the
        line and returns the result`, function() {
      const result = model.export();
      expect(result).toHaveProperty('firstName', 'Harrison');
      expect(result.roles).toEqual({
        admin: false,
        user: true,
        owner: false,
      });
    });

    it(`should export all data into the given target object without expanding properties
            if the expandProperties is set as false`, function() {
      const result = model.export({}, false);
      expect(result).toHaveProperty('firstName', 'Harrison');
      expect(result).not.toHaveProperty('roles');
    });
  });

  describe(`#skipFields(...fields: string[]): this`, function() {
    it(`should skip the given fields when exporting data`, function() {
      const result = model.skipFields('firstName', 'last_name').export();
      expect(result).not.toHaveProperty('firstName', 'Harrison');
    });
  });

  describe(`#renameField(oldName: string, newName: string): this`, function() {
    it(`should rename the given field to the given new name when exporting data`, function() {
      const result = model.renameField('firstName', 'name').export();
      expect(result).not.toHaveProperty('firstName');
      expect(result).toHaveProperty('name');
    });
  });

  describe(`#renameFields(fields: {[oldName: string]: string}): this`, function() {
    it(`should rename the given fields to the given new names when exporting data`, function() {
      const result = model
        .renameFields({
          firstName: 'name',
        })
        .export();
      expect(result).not.toHaveProperty('firstName');
      expect(result).toHaveProperty('name');
    });
  });
});
