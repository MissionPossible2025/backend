import mongoose from 'mongoose';

/** Single canonical form for storage and lookup (trim + strip whitespace). */
export function normalizeCustomerPhone(phone) {
  if (phone === undefined || phone === null) return '';
  return String(phone).trim().replace(/\s+/g, '');
}

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customerSchema.pre('save', function(next) {
  if (this.phone != null) {
    this.phone = normalizeCustomerPhone(this.phone);
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Customer', customerSchema);
