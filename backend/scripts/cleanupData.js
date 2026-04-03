// Script to clean up all data except Seller info and Customer Management data
// This script will:
// - Delete all Orders
// - Delete all Products
// - Delete all Carts
// - Delete all Categories
// - Delete all Highlighted Products
// - Keep all Users (sellers and customers)
// - Keep all Customers (customer management data)

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

// Import models
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';
import Category from '../models/categoryModel.js';
import HighlightedProduct from '../models/highlightedProductModel.js';
import User from '../models/userModel.js';
import Customer from '../models/customerModel.js';

dotenv.config();

const cleanupData = async () => {
  try {
    console.log('🔄 Starting data cleanup process...');
    console.log('⚠️  This will delete all orders, products, carts, categories, and highlighted products');
    console.log('✅ Seller info and Customer Management data will be preserved\n');

    // Connect to database
    await connectDB();

    // Get counts before deletion for reporting
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    const cartCount = await Cart.countDocuments();
    const categoryCount = await Category.countDocuments();
    const highlightedProductCount = await HighlightedProduct.countDocuments();
    const userCount = await User.countDocuments();
    const customerCount = await Customer.countDocuments();

    console.log('📊 Current data counts:');
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Carts: ${cartCount}`);
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Highlighted Products: ${highlightedProductCount}`);
    console.log(`   - Users (sellers + customers): ${userCount} (will be kept)`);
    console.log(`   - Customers (management data): ${customerCount} (will be kept)\n`);

    // Delete Orders
    console.log('🗑️  Deleting all orders...');
    const orderResult = await Order.deleteMany({});
    console.log(`   ✅ Deleted ${orderResult.deletedCount} orders`);

    // Delete Products
    console.log('🗑️  Deleting all products...');
    const productResult = await Product.deleteMany({});
    console.log(`   ✅ Deleted ${productResult.deletedCount} products`);

    // Delete Carts
    console.log('🗑️  Deleting all carts...');
    const cartResult = await Cart.deleteMany({});
    console.log(`   ✅ Deleted ${cartResult.deletedCount} carts`);

    // Delete Categories
    console.log('🗑️  Deleting all categories...');
    const categoryResult = await Category.deleteMany({});
    console.log(`   ✅ Deleted ${categoryResult.deletedCount} categories`);

    // Delete Highlighted Products
    console.log('🗑️  Deleting all highlighted products...');
    const highlightedProductResult = await HighlightedProduct.deleteMany({});
    console.log(`   ✅ Deleted ${highlightedProductResult.deletedCount} highlighted products`);

    // Verify data preserved
    console.log('\n✅ Verification - Data preserved:');
    const remainingUserCount = await User.countDocuments();
    const remainingCustomerCount = await Customer.countDocuments();
    const sellerCount = await User.countDocuments({ role: 'seller' });
    const customerUserCount = await User.countDocuments({ role: 'customer' });
    
    console.log(`   - Users (all): ${remainingUserCount}`);
    console.log(`     - Sellers: ${sellerCount} ✅`);
    console.log(`     - Customer users: ${customerUserCount} ✅`);
    console.log(`   - Customers (management): ${remainingCustomerCount} ✅`);

    // Verify deletions
    console.log('\n✅ Verification - Data deleted:');
    const remainingOrderCount = await Order.countDocuments();
    const remainingProductCount = await Product.countDocuments();
    const remainingCartCount = await Cart.countDocuments();
    const remainingCategoryCount = await Category.countDocuments();
    const remainingHighlightedProductCount = await HighlightedProduct.countDocuments();

    console.log(`   - Orders: ${remainingOrderCount} (should be 0)`);
    console.log(`   - Products: ${remainingProductCount} (should be 0)`);
    console.log(`   - Carts: ${remainingCartCount} (should be 0)`);
    console.log(`   - Categories: ${remainingCategoryCount} (should be 0)`);
    console.log(`   - Highlighted Products: ${remainingHighlightedProductCount} (should be 0)`);

    console.log('\n✨ Cleanup completed successfully!');
    console.log('✅ All specified data has been deleted');
    console.log('✅ Seller information and Customer Management data have been preserved');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run cleanup
cleanupData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

