import WalletConfig from '../models/walletConfigModel.js';
import User from '../models/userModel.js';
import Customer from '../models/customerModel.js';
import WalletTransaction from '../models/walletTransactionModel.js';
import Order from '../models/orderModel.js';

// Helper to validate and normalize slabs
function validateAndNormalizeSlabs(slabs) {
  if (!Array.isArray(slabs)) {
    throw new Error('Slabs must be an array');
  }

  const normalized = slabs.map((slab, index) => {
    const minAmount = Number(slab.minAmount);
    const maxAmount = Number(slab.maxAmount);
    const percentage = Number(slab.percentage);

    if (!Number.isFinite(minAmount) || !Number.isFinite(maxAmount) || !Number.isFinite(percentage)) {
      throw new Error(`Slab ${index + 1}: minAmount, maxAmount and percentage must be numbers`);
    }
    if (minAmount < 0 || maxAmount <= minAmount) {
      throw new Error(`Slab ${index + 1}: maxAmount must be greater than minAmount and both must be non-negative`);
    }
    if (percentage < 0 || percentage > 100) {
      throw new Error(`Slab ${index + 1}: percentage must be between 0 and 100`);
    }

    return { minAmount, maxAmount, percentage };
  });

  // Sort by minAmount
  normalized.sort((a, b) => a.minAmount - b.minAmount);

  // Check for overlapping ranges
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const curr = normalized[i];
    if (curr.minAmount < prev.maxAmount) {
      throw new Error(
        `Slabs ${i} and ${i + 1} have overlapping ranges. ` +
          `Ensure each slab's minAmount is >= previous slab's maxAmount.`
      );
    }
  }

  return normalized;
}

export const getWalletConfigForSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const config = await WalletConfig.findOne({ sellerId });
    res.json({
      sellerId,
      slabs: config?.slabs || []
    });
  } catch (error) {
    console.error('Error fetching wallet config:', error);
    res.status(500).json({ error: 'Failed to fetch wallet configuration' });
  }
};

export const upsertWalletConfigForSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { slabs } = req.body;

    const normalizedSlabs = validateAndNormalizeSlabs(slabs || []);

    const config = await WalletConfig.findOneAndUpdate(
      { sellerId },
      { sellerId, slabs: normalizedSlabs },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Wallet configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating wallet config:', error);
    res.status(400).json({ error: error.message || 'Failed to update wallet configuration' });
  }
};

export const getWalletBalanceForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    let record = await User.findById(customerId).select('walletBalance name email');
    let source = 'user';

    if (!record) {
      record = await Customer.findById(customerId).select('walletBalance name email');
      source = 'customer';
    }

    if (!record) {
      // Graceful fallback for first-time users
      return res.json({
        customerId,
        walletBalance: 0,
        user: null,
        source: null
      });
    }

    res.json({
      customerId,
      walletBalance: record.walletBalance || 0,
      user: {
        name: record.name,
        email: record.email
      },
      source
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

export const getWalletHistoryForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    let transactions = await WalletTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    // Backfill history for older orders if wallet balance exists but transaction
    // rows were not recorded at that time.
    if (!transactions.length) {
      let customerRecord = await User.findById(customerId).select('walletBalance').lean();
      let customerSource = 'user';
      if (!customerRecord) {
        customerRecord = await Customer.findById(customerId).select('walletBalance').lean();
        customerSource = 'customer';
      }

      const currentBalance = Number(customerRecord?.walletBalance || 0);

      const orders = await Order.find({
        customer: customerId,
        $or: [{ walletUsed: { $gt: 0 } }, { cashbackAmount: { $gt: 0 } }]
      })
        .select('orderId walletUsed cashbackAmount createdAt')
        .sort({ createdAt: 1 })
        .lean();

      if (orders.length) {
        const netDelta = orders.reduce((sum, order) => {
          const debit = Number(order.walletUsed || 0);
          const credit = Number(order.cashbackAmount || 0);
          return sum + (credit - debit);
        }, 0);

        // Infer opening balance so replayed history aligns with current balance.
        const openingBalance = Number((currentBalance - netDelta).toFixed(2));
        let runningBalance = Math.max(0, openingBalance);

        const backfillDocs = [];
        for (const order of orders) {
          const debit = Number(order.walletUsed || 0);
          const credit = Number(order.cashbackAmount || 0);
          const baseTime = new Date(order.createdAt || Date.now());

          if (debit > 0) {
            runningBalance = Math.max(0, Number((runningBalance - debit).toFixed(2)));
            backfillDocs.push({
              customerId,
              customerSource,
              orderId: order.orderId || '',
              transactionType: 'debit',
              amount: Number(debit.toFixed(2)),
              updatedBalance: runningBalance,
              note: 'Wallet used in order',
              createdAt: baseTime,
              updatedAt: baseTime
            });
          }

          if (credit > 0) {
            // Ensure separate timestamp ordering in same order: debit first, credit second.
            const creditTime = new Date(baseTime.getTime() + 1);
            runningBalance = Number((runningBalance + credit).toFixed(2));
            backfillDocs.push({
              customerId,
              customerSource,
              orderId: order.orderId || '',
              transactionType: 'credit',
              amount: Number(credit.toFixed(2)),
              updatedBalance: runningBalance,
              note: 'Cashback earned',
              createdAt: creditTime,
              updatedAt: creditTime
            });
          }
        }

        if (backfillDocs.length) {
          await WalletTransaction.insertMany(backfillDocs, { ordered: true });
          transactions = await WalletTransaction.find({ customerId })
            .sort({ createdAt: -1 })
            .lean();
        }
      }
    }

    res.json({
      customerId,
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    res.status(500).json({ error: 'Failed to fetch wallet history' });
  }
};

