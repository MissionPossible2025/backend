// controllers/highlightedProductController.js
import HighlightedProduct from '../models/highlightedProductModel.js';

// Get highlighted products for a seller
export const getHighlightedProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    console.log(`[Highlighted] Fetching highlighted products for seller: ${sellerId}`);
    
    // Convert sellerId to ObjectId for proper comparison
    const mongoose = (await import('mongoose')).default;
    let sellerObjectId;
    try {
      sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerObjectId });
    
    // If no highlighted products exist, create an empty one
    if (!highlighted) {
      console.log(`[Highlighted] No highlighted products found, creating new entry for seller ${sellerObjectId}`);
      highlighted = new HighlightedProduct({
        seller: sellerObjectId,
        productIds: []
      });
      await highlighted.save();
    }
    
    console.log(`[Highlighted] Fetched highlighted products for seller ${sellerObjectId}:`, highlighted.productIds);
    console.log(`[Highlighted] Product IDs count: ${highlighted.productIds.length}`);
    console.log(`[Highlighted] Full highlighted object:`, JSON.stringify(highlighted, null, 2));
    
    res.json({ highlighted });
  } catch (error) {
    console.error('Error fetching highlighted products:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a product ID to highlighted products
export const addHighlightedProduct = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productId } = req.body;
    
    console.log(`[Highlighted] Add request - sellerId: ${sellerId}, productId: ${productId}`);
    
    if (!productId || !productId.trim()) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Use product ID exactly as entered (just trim whitespace, case-sensitive match)
    const trimmedProductId = productId.trim();
    console.log(`[Highlighted] Product ID to match (exact): ${trimmedProductId}`);
    
    // Validate that the product exists and belongs to this seller
    const Product = (await import('../models/productModel.js')).default;
    const mongoose = (await import('mongoose')).default;
    
    // Convert sellerId to ObjectId for proper comparison
    let sellerObjectId;
    try {
      sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }
    
    console.log(`[Highlighted] Searching for product with productId: "${trimmedProductId}" (exact match), seller: ${sellerObjectId}`);
    
    // Search for product with exact productId match (case-sensitive)
    const product = await Product.findOne({ 
      productId: trimmedProductId, // Exact match, case-sensitive
      seller: sellerObjectId,
      isActive: true
    });
    
    if (!product) {
      // Check if product exists at all (for better error message) - try exact match first
      const productExists = await Product.findOne({ 
        productId: trimmedProductId, // Exact match
        isActive: true
      });
      
      if (productExists) {
        console.log(`[Highlighted] Product found but belongs to different seller. Product seller: ${productExists.seller}, Request seller: ${sellerObjectId}`);
        return res.status(403).json({ 
          error: `Product with ID "${trimmedProductId}" belongs to a different seller. You can only highlight your own products.` 
        });
      } else {
        console.log(`[Highlighted] Product not found with exact ID: "${trimmedProductId}"`);
        return res.status(404).json({ 
          error: `Product with ID "${trimmedProductId}" not found. Please make sure the product ID matches exactly (case-sensitive) and the product is active.` 
        });
      }
    }
    
    console.log(`[Highlighted] Product found: ${product.name} (productId: "${product.productId}")`);
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerObjectId });
    
    if (!highlighted) {
      console.log(`[Highlighted] Creating new highlighted products entry for seller ${sellerObjectId}`);
      highlighted = new HighlightedProduct({
        seller: sellerObjectId,
        productIds: [trimmedProductId] // Store exactly as entered
      });
    } else {
      // Check if product ID already exists (exact match, case-sensitive)
      const exists = highlighted.productIds.some(id => id === trimmedProductId);
      if (exists) {
        console.log(`[Highlighted] Product ID already exists in highlighted products`);
        return res.status(400).json({ error: 'Product ID already exists in highlighted products' });
      }
      console.log(`[Highlighted] Adding product ID to existing list. Current count: ${highlighted.productIds.length}`);
      highlighted.productIds.push(trimmedProductId); // Store exactly as entered
    }
    
    await highlighted.save();
    console.log(`[Highlighted] ✓ Successfully saved. Product ID "${trimmedProductId}" added for seller ${sellerObjectId}. Total IDs: ${highlighted.productIds.length}`);
    console.log(`[Highlighted] Current productIds array:`, highlighted.productIds);
    
    // Return the updated highlighted products (refetch to ensure we have the latest)
    const updatedHighlighted = await HighlightedProduct.findOne({ seller: sellerObjectId });
    console.log(`[Highlighted] Returning updated highlighted products with ${updatedHighlighted.productIds.length} IDs`);
    
    res.json({ 
      message: 'Product added to highlighted products',
      highlighted: updatedHighlighted 
    });
  } catch (error) {
    console.error('[Highlighted] Error adding highlighted product:', error);
    console.error('[Highlighted] Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Remove a product ID from highlighted products
export const removeHighlightedProduct = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productId } = req.body;
    
    if (!productId || !productId.trim()) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Use product ID exactly as entered (case-sensitive match)
    const trimmedProductId = productId.trim();
    
    // Convert sellerId to ObjectId for proper comparison
    const mongoose = (await import('mongoose')).default;
    let sellerObjectId;
    try {
      sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }
    
    const highlighted = await HighlightedProduct.findOne({ seller: sellerObjectId });
    
    if (!highlighted) {
      return res.status(404).json({ error: 'No highlighted products found' });
    }
    
    // Remove using exact match (case-sensitive)
    const beforeCount = highlighted.productIds.length;
    highlighted.productIds = highlighted.productIds.filter(
      id => id !== trimmedProductId
    );
    const afterCount = highlighted.productIds.length;
    
    if (beforeCount === afterCount) {
      return res.status(404).json({ error: 'Product ID not found in highlighted products' });
    }
    
    await highlighted.save();
    console.log(`[Highlighted] Removed product ID "${trimmedProductId}" for seller ${sellerObjectId}. Remaining IDs: ${highlighted.productIds.length}`);
    res.json({ 
      message: 'Product removed from highlighted products',
      highlighted 
    });
  } catch (error) {
    console.error('Error removing highlighted product:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update highlighted products (replace entire list)
export const updateHighlightedProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    
    let highlighted = await HighlightedProduct.findOne({ seller: sellerId });
    
    if (!highlighted) {
      highlighted = new HighlightedProduct({
        seller: sellerId,
        productIds: productIds.map(id => id.trim())
      });
    } else {
      highlighted.productIds = productIds.map(id => id.trim());
    }
    
    await highlighted.save();
    res.json({ 
      message: 'Highlighted products updated',
      highlighted 
    });
  } catch (error) {
    console.error('Error updating highlighted products:', error);
    res.status(500).json({ error: error.message });
  }
};


