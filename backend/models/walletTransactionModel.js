import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    customerSource: {
      type: String,
      enum: ['user', 'customer'],
      required: true
    },
    orderId: {
      type: String,
      default: ''
    },
    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    updatedBalance: {
      type: Number,
      required: true,
      min: 0
    },
    note: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ customerId: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;

