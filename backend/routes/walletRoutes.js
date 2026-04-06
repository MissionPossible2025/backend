import express from 'express';
import {
  getPublicCashbackOffers,
  getWalletConfigForSeller,
  upsertWalletConfigForSeller,
  getWalletBalanceForCustomer,
  getWalletHistoryForCustomer
} from '../controllers/walletController.js';

const router = express.Router();

// Customer-facing: cashback tiers (read-only)
router.get('/cashback-offers', getPublicCashbackOffers);

// Seller wallet configuration (cashback slabs)
router.get('/config/:sellerId', getWalletConfigForSeller);
router.put('/config/:sellerId', upsertWalletConfigForSeller);

// Customer wallet balance
router.get('/balance/:customerId', getWalletBalanceForCustomer);
router.get('/history/:customerId', getWalletHistoryForCustomer);

export default router;

