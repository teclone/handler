import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  firstName: mongoose.SchemaTypes.String,
  lastName: mongoose.SchemaTypes.String,
  email: mongoose.SchemaTypes.String,
  password: mongoose.SchemaTypes.String,
});

export default mongoose.model('User', schema);
