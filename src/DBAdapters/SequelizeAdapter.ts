import { Adapter } from './Adapter';

export class SequelizeAdapter<F extends string> extends Adapter<F> {
  itExists(model: any, query) {
    return model
      .findOne({
        where: query,
      })
      .then((result) => result !== null);
  }

  itDoesNotExist(model: any, query) {
    return model.findOne({ where: query }).then((result) => result === null);
  }
}
