// Script to update existing products with taxPercentage field
import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateProductsWithTaxPercentage = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seller-customer-platform');
    console.log('Connected to MongoDB');

    // Update all products that don't have taxPercentage field
    const result = await Product.updateMany(
      { taxPercentage: { $exists: false } },
      { $set: { taxPercentage: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} products with taxPercentage field`);

    // Also update products that have taxPercentage as null or undefined
    const result2 = await Product.updateMany(
      { 
        $or: [
          { taxPercentage: null },
          { taxPercentage: undefined }
        ]
      },
      { $set: { taxPercentage: 0 } }
    );

    console.log(`Updated ${result2.modifiedCount} additional products with taxPercentage field`);

    // Verify the update
    const productsWithTax = await Product.find({ taxPercentage: { $exists: true } });
    console.log(`Total products with taxPercentage field: ${productsWithTax.length}`);

    // Show some examples
    const sampleProducts = await Product.find({}).limit(3);
    console.log('Sample products:');
    sampleProducts.forEach(product => {
      console.log(`- ${product.name}: taxPercentage = ${product.taxPercentage}`);
    });

  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
updateProductsWithTaxPercentage();
