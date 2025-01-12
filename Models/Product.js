import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
  },
  price: {
    type: Number,
    required: true,
  },
  photoUrls: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5'],
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 5;
}

const Product = mongoose.model('product', ProductSchema);

export default Product;
