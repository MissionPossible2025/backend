// models/cartModel.js
import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    discountedPrice: {
      type: Number
    },
    // Variant information for products with multi-attribute variations
    variant: {
      combination: {
        type: Map,
        of: String
      },
      price: {
        type: Number,
        min: 0
      },
      originalPrice: {
        type: Number,
        min: 0
      },
      stock: {
        type: String,
        enum: ['in_stock', 'out_of_stock'],
        default: 'in_stock'
      }
    }
  }],
  totalAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    const price = item.discountedPrice && item.discountedPrice < item.price 
      ? item.discountedPrice 
      : item.price;
    return total + (price * item.quantity);
  }, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
