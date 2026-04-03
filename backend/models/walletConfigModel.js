import mongoose from 'mongoose';

const cashbackSlabSchema = new mongoose.Schema(
  {
    minAmount: {
      type: Number,
      required: true,
      min: 0
    },
    maxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  { _id: false }
);

const walletConfigSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    slabs: {
      type: [cashbackSlabSchema],
      default: []
    }
  },
  { timestamps: true }
);

const WalletConfig = mongoose.model('WalletConfig', walletConfigSchema);

export default WalletConfig;

