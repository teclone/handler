import DBChecker from '../src/DBChecker';
import { DB_MODELS } from '../src/Constants';
import {
  noSqlConnect,
  noSqlDisconnect,
  noSqlPopulate,
  noSqlDepopulate,
  sqlConnect,
  sqlPopulate,
  sqlDepopulate,
  sqlDisconnect
} from './helpers';
import NoSqlUser from './helpers/nosql/models/User';
import SqlUser from './helpers/sql/models/User';
import { CASE_STYLES } from '@forensic-js/utils';

describe('DBChecker', function() {
  let dbChecker: DBChecker = null;
  let noSqlDocumentId = '';

  beforeAll(async function() {
    await sqlConnect();
    await noSqlConnect();

    await sqlPopulate();
    noSqlDocumentId = (await noSqlPopulate()).id;
  });

  beforeEach(function() {
    dbChecker = new DBChecker()
      .setDBModel(DB_MODELS.NOSQL)
      .setDBCaseStyle(CASE_STYLES.CAMEL_CASE);
  });

  afterAll(async function() {
    await sqlDepopulate();
    await noSqlDepopulate();

    await sqlDisconnect();
    await noSqlDisconnect();
  });

  describe('#constructor()', function() {
    it(`should create a db checker instance`, function() {
      expect(new DBChecker()).toBeInstanceOf(DBChecker);
    });
  });

  describe('#setDBModel(dbModel: number)', function() {
    it(`should set the database model in use and return this`, function() {
      expect(dbChecker.setDBModel(DB_MODELS.NOSQL)).toStrictEqual(dbChecker);
    });
  });

  describe('#setDBCaseStyle(dbModelCaseStyle: number)', function() {
    it(`should set the database model case style in use and return this`, function() {
      expect(dbChecker.setDBCaseStyle(CASE_STYLES.CAMEL_CASE)).toStrictEqual(
        dbChecker
      );
    });
  });

  describe(`async #checkIfExists(required: boolean, field: string, value: DataValue,
        check: ModelDBCheck, index: number)`, function() {
    it(`should perform db check using mongoose countDocuments method if db model is nosql, setting error if field exists`, function() {
      return dbChecker
        .checkIfExists(
          'email',
          true,
          'email',
          'someone@example.com',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should perform db check using sequelize count method if db model is relational, setting error if field exists`, function() {
      return dbChecker
        .setDBModel(DB_MODELS.RELATIONAL)
        .checkIfExists(
          'email',
          true,
          'email',
          'someone@example.com',
          {
            if: 'exists',
            model: SqlUser,
            query: {
              email: 'someone@example.com'
            }
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should construct the query if not given using the field parameter`, function() {
      return dbChecker
        .checkIfExists(
          'email',
          true,
          'email',
          'someone@example.com',
          {
            if: 'exists',
            model: NoSqlUser,
            field: 'email'
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should default the field parameter to the current field name under check`, function() {
      return dbChecker
        .checkIfExists(
          'email',
          true,
          'email',
          'someone@example.com',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should default the field parameter to _id if field type is objectId and query is not set nor  is field`, function() {
      console.log(noSqlDocumentId);
      return dbChecker
        .checkIfExists(
          'objectId',
          true,
          'user',
          noSqlDocumentId,
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`Nosql test: should set no error if field does not exist, resolving to true`, function() {
      return dbChecker
        .checkIfExists(
          'email',
          true,
          'email',
          'someone1@example.com',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });

    it(`sql test: should set no error if field does not exist, resolving to true`, function() {
      return dbChecker
        .setDBModel(DB_MODELS.RELATIONAL)
        .checkIfExists(
          'email',
          true,
          'email',
          'someone1@example.com',
          {
            if: 'exists',
            model: SqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });

    it(`should perform no check if field is empty but not required, returning true`, function() {
      return dbChecker
        .checkIfExists(
          'email',
          false,
          'email',
          '',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });
  });

  describe(`async #checkIfNotExists(required: boolean, field: string, value: DataValue,
        check: ModelDBCheck, index: number)`, function() {
    it(`should perform db check, setting error if field does not exist`, function() {
      return dbChecker
        .checkIfNotExists(
          'email',
          true,
          'email',
          'someone1@example.com',
          {
            if: 'notExists',
            model: NoSqlUser,
            query: {
              email: 'someone1@example.com'
            }
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should set no error if field exists, resolving to true`, function() {
      return dbChecker
        .checkIfNotExists(
          'email',
          true,
          'email',
          'someone@example.com',
          {
            if: 'notExists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });

    it(`should perform no check if field is empty but not required, returning true`, function() {
      return dbChecker
        .checkIfNotExists(
          'email',
          false,
          'email',
          '',
          {
            if: 'notExists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });
  });

  describe(`case conversion`, function() {
    it(`should convert field to camel case format if case style is set as CAMEL_CASE`, function() {
      return dbChecker
        .checkIfExists(
          'name',
          true,
          'last-name',
          'Ifeanyichukwu',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeFalsy();
        });
    });

    it(`should convert field to snake case format if case style is set as SNAKE_CASE`, function() {
      dbChecker.setDBCaseStyle(CASE_STYLES.SNAKE_CASE);
      return dbChecker
        .checkIfExists(
          'name',
          true,
          'last-name',
          'Ifeanyichukwu',
          {
            if: 'exists',
            model: NoSqlUser
          },
          0
        )
        .then(succeeds => {
          expect(succeeds).toBeTruthy();
        });
    });
  });
});
