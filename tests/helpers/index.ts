import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';
import NoSqlUser from './nosql/models/User';
import sequelize from './sql/sequelize';
import SqlUser from './sql/models/User';
import { FileEntry, FileEntryCollection } from '@teclone/r-server/lib/@types';

export const getFilesDirectory = () => {
  return path.resolve(__dirname, 'files');
};

export const createFile = (filename: string = 'test.pdf'): FileEntry => {
  const link = path.resolve(__dirname, 'files', filename);
  const size = fs.statSync(link).size;

  return {
    name: filename,
    key: filename,
    path: link,
    size,
    type: 'application/pdf',
  };
};

export const createFileCollection = (
  filenames: string[] = ['test.pdf'],
): FileEntryCollection => {
  const template: FileEntryCollection = {
    name: [],
    key: [],
    path: [],
    size: [],
    type: [],
  };
  return filenames.reduce((result, filename) => {
    const link = path.resolve(__dirname, 'files', filename);
    const stat = fs.statSync(link);

    result.name.push(filename);
    result.key.push(filename);
    result.path.push(link);
    result.size.push(stat.size);
    result.type.push('application/octet-stream');

    return result;
  }, template);
};

export const noSqlConnect = function() {
  return new Promise(resolve => {
    mongoose.connections[0].once('open', function() {
      resolve();
    });
    mongoose.connect('mongodb://localhost/test', {
      useNewUrlParser: true,
    });
  });
};

export const noSqlDisconnect = function() {
  return new Promise(resolve => {
    mongoose.connections[0].close(function() {
      resolve();
    });
  });
};

export const noSqlPopulate = function() {
  return NoSqlUser.create({
    firstName: 'Harrison',
    lastName: 'Ifeanyichukwu',
    email: 'someone@example.com',
    password: 'random_243',
  });
};

export const noSqlDepopulate = function() {
  return NoSqlUser.deleteMany({}).exec();
};

export const sqlConnect = function() {
  return sequelize.authenticate();
};

export const sqlDisconnect = function() {
  return sequelize.close();
};

export const sqlPopulate = async function() {
  return SqlUser.sync({ force: true }).then(() => {
    return SqlUser.create({
      firstName: 'Harrison',
      lastName: 'Ifeanyichukwu',
      email: 'someone@example.com',
      password: 'random_243',
    });
  });
};

export const sqlDepopulate = function() {
  return SqlUser.drop();
};
