import express from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// Placeholder GET for /api/cart
router.get('/', (req, res) => {
  res.json({ message: 'Cart is empty', items: [] });
});

// Add item to cart
router.post('/add', addToCart);

// Get user's cart
router.get('/:userId', getCart);

// Update cart item quantity
router.put('/update', updateCartItem);

// Remove item from cart
router.delete('/remove', removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

export default router;
