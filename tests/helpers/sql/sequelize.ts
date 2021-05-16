import { Dialect, Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'test',
  process.env.DB_USER || 'root',
  process.env.DB_PSWD || '',
  {
    host: 'localhost',
    dialect: (process.env.DB_DIALECT as Dialect) || 'mysql',
  }
);
