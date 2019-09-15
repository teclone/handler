import { Sequelize } from 'sequelize';

export default new Sequelize(process.env.DB_NAME || 'test', process.env.DB_USER || 'root', process.env.DB_PSWD || '', {
  host: 'localhost',
  dialect: 'mysql',
});
