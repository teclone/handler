import { Adapter } from './Adapter';
import type { Model } from 'mongoose';

export class MongooseAdapter<F extends string> extends Adapter<F> {
  itExists(model: Model<any>, query) {
    return model
      .findOne(query)
      .exec()
      .then((result) => result !== null);
  }

  itDoesNotExist(model: Model<any>, query) {
    return model
      .findOne(query)
      .exec()
      .then((result) => {
        return result === null;
      });
  }
}
