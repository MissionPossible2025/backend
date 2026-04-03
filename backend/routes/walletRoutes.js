import express from 'express';
import {
  getWalletConfigForSeller,
  upsertWalletConfigForSeller,
  getWalletBalanceForCustomer,
  getWalletHistoryForCustomer
} from '../controllers/walletController.js';

const router = express.Router();

// Seller wallet configuration (cashback slabs)
router.get('/config/:sellerId', getWalletConfigForSeller);
router.put('/config/:sellerId', upsertWalletConfigForSeller);

// Customer wallet balance
router.get('/balance/:customerId', getWalletBalanceForCustomer);
router.get('/history/:customerId', getWalletHistoryForCustomer);

export default router;

