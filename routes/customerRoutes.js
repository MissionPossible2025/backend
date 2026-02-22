import express from 'express';
import {
  getCustomersBySeller,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  checkPhoneNumber,
  customerSignup,
  customerLogin
} from '../controllers/customerController.js';

const router = express.Router();

// Routes for seller to manage customers
router.get('/seller/:sellerId', getCustomersBySeller);
router.get('/:id', getCustomerById); // Add GET by ID route
router.post('/', addCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// Routes for customer authentication
router.post('/check', checkPhoneNumber);
router.post('/signup', customerSignup);
router.post('/login', customerLogin);

export default router;
