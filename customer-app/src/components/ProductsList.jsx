import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import resolveImageUrl, { getPlaceholderImage } from '../utils/imageUtils'
import { getProductDiscountPct } from '../utils/productDetailHelpers.js'

export default function ProductsList({ searchTerm: externalSearchTerm = '' }) {
  const responsiveGridStyles = `
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      grid-auto-rows: 1fr;
      align-items: stretch;
      width: 100%;
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      .products-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .highlighted-nav-button {
        display: none !important;
      }
    }
  `
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({}) // Track which categories are expanded
  const { fetchCartCount } = useCart()
  const [highlightedProducts, setHighlightedProducts] = useState([])
  const [currentHighlightedIndex, setCurrentHighlightedIndex] = useState(0)
  const [highlightedTouchStart, setHighlightedTouchStart] = useState(null)
  const [highlightedTouchEnd, setHighlightedTouchEnd] = useState(null)
  
  // Touch handlers for highlighted products swipe
  const handleHighlightedTouchStart = (e) => {
    setHighlightedTouchEnd(null)
    setHighlightedTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleHighlightedTouchMove = (e) => {
    setHighlightedTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleHighlightedTouchEnd = () => {
    if (!highlightedTouchStart || !highlightedTouchEnd) return
    
    const distance = highlightedTouchStart - highlightedTouchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe && highlightedProducts.length > 0) {
      setCurrentHighlightedIndex(prev => prev < highlightedProducts.length - 1 ? prev + 1 : 0)
    }
    if (isRightSwipe && highlightedProducts.length > 0) {
      setCurrentHighlightedIndex(prev => prev > 0 ? prev - 1 : highlightedProducts.length - 1)
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch categories')
      }
      
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Fetch highlighted products
  const fetchHighlightedProducts = async (productsList = null) => {
    try {
      // Force console output
      console.log('%c[Highlighted] ===== STARTING FETCH =====', 'color: red; font-size: 16px; font-weight: bold;')
      console.log('[Highlighted] ===== STARTING FETCH =====')
      
      const productsToUse = productsList || products
      console.log('[Highlighted] Products to use:', productsToUse.length)
      
      if (productsToUse.length === 0) {
        console.log('[Highlighted] No products available')
        setHighlightedProducts([])
        return
      }
      
      // Get all unique seller IDs from products (in case there are multiple sellers)
      const extractSellerId = (product) => {
        if (!product.seller) return null
        if (typeof product.seller === 'object' && product.seller._id) {
          return product.seller._id.toString()
        } else if (typeof product.seller === 'string') {
          return product.seller
        } else if (product.seller && product.seller.toString) {
          return product.seller.toString()
        }
        return null
      }
      
      // Get unique seller IDs from all products
      const sellerIds = new Set()
      productsToUse.forEach(product => {
        const sid = extractSellerId(product)
        if (sid) sellerIds.add(sid)
      })
      
      const uniqueSellerIds = Array.from(sellerIds)
      console.log('[Highlighted] Found unique seller IDs:', uniqueSellerIds)
      console.log('[Highlighted] Total unique sellers:', uniqueSellerIds.length)
      
      if (uniqueSellerIds.length === 0) {
        console.error('[Highlighted] ERROR: No seller IDs found in any products')
        setHighlightedProducts([])
        return
      }
      
      // Fetch highlighted products for all sellers and combine them
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      let allProductIds = []
      let primarySellerId = uniqueSellerIds[0] // Use first seller as primary for product fetching
      
      console.log('[Highlighted] Fetching highlighted products for all sellers...')
      
      // Fetch highlighted products for each seller
      for (const currentSellerId of uniqueSellerIds) {
        const apiUrl = `${baseUrl}/highlighted-products/seller/${currentSellerId}`
        console.log(`[Highlighted] Fetching from: ${apiUrl}`)
        
        try {
          const highlightedResponse = await fetch(apiUrl)
          console.log(`[Highlighted] Response status for seller ${currentSellerId}:`, highlightedResponse.status, highlightedResponse.statusText)
          
          if (highlightedResponse.ok) {
            const highlightedData = await highlightedResponse.json()
            const sellerProductIds = highlightedData.highlighted?.productIds || []
            
            console.log(`[Highlighted] Seller ${currentSellerId} has ${sellerProductIds.length} highlighted products:`, sellerProductIds)
            
            if (sellerProductIds.length > 0) {
              allProductIds.push(...sellerProductIds)
              // Use the first seller that has highlighted products as primary
              if (allProductIds.length === sellerProductIds.length) {
                primarySellerId = currentSellerId
              }
            }
          } else {
            const errorText = await highlightedResponse.text()
            console.warn(`[Highlighted] Failed to fetch for seller ${currentSellerId}:`, highlightedResponse.status, errorText)
          }
        } catch (fetchError) {
          console.warn(`[Highlighted] Error fetching for seller ${currentSellerId}:`, fetchError)
        }
      }
      
      console.log('[Highlighted] Total highlighted product IDs from all sellers:', allProductIds.length)
      console.log('[Highlighted] All product IDs:', allProductIds)
      console.log('[Highlighted] Primary seller ID for product fetching:', primarySellerId)
      
      const productIds = allProductIds
      const sellerId = primarySellerId // Use primary seller for fetching product details
      
      // Log sample products for comparison
      const sampleProducts = productsToUse.slice(0, 5).map(p => ({ 
        name: p.name, 
        productId: p.productId, 
        productIdUpper: p.productId?.toUpperCase(),
        _id: p._id 
      }))
      console.log('[Highlighted] Sample products from list:', sampleProducts)
      
      if (productIds.length === 0) {
        console.warn('[Highlighted] WARNING: No highlighted product IDs found in backend. Make sure you added product IDs in seller app.')
        setHighlightedProducts([])
        return
      }
      
      // Try to fetch products by productIds from backend API first
      let highlightedProductsList = []
      try {
        console.log('[Highlighted] Attempting to fetch products from backend API...')
        console.log('[Highlighted] Sending productIds:', productIds)
        console.log('[Highlighted] Sending sellerId:', sellerId, '(may be null if multiple sellers)')
        
        // If we have multiple sellers, don't filter by seller (fetch all matching products)
        // Otherwise, filter by the primary seller
        const requestBody = uniqueSellerIds.length > 1 
          ? { productIds } // No seller filter - get products from any seller
          : { productIds, sellerId } // Filter by seller
        
        console.log('[Highlighted] Request body:', requestBody)
        
        const productsResponse = await fetch(`${baseUrl}/products/by-product-ids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
        
        console.log('[Highlighted] API response status:', productsResponse.status, productsResponse.statusText)
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          highlightedProductsList = productsData.products || []
          console.log('[Highlighted] ✓ Successfully fetched products from backend API:', highlightedProductsList.length)
          console.log('[Highlighted] Fetched products:', highlightedProductsList.map(p => ({ name: p.name, productId: p.productId })))
          
          if (highlightedProductsList.length === 0) {
            console.warn('[Highlighted] API returned empty array. This might mean:')
            console.warn('[Highlighted] 1. Product IDs in highlighted products don\'t match any products')
            console.warn('[Highlighted] 2. Products belong to a different seller')
            console.warn('[Highlighted] 3. Products are inactive')
            console.warn('[Highlighted] Falling back to client-side matching...')
            throw new Error('API returned empty array')
          }
        } else {
          const errorText = await productsResponse.text()
          console.error('[Highlighted] Backend API failed:', productsResponse.status, errorText)
          console.warn('[Highlighted] Backend API failed, falling back to client-side matching')
          throw new Error('Backend API failed')
        }
      } catch (apiError) {
        console.log('[Highlighted] Using client-side matching as fallback...')
        // Fallback to client-side matching if backend endpoint fails
        // Match productId exactly (case-sensitive) as stored in database
        highlightedProductsList = productsToUse.filter(p => {
          const pProductId = p.productId ? p.productId.trim() : null
          const pId = p._id ? String(p._id).trim() : null
          
          // Try to match with productId (exact match, case-sensitive)
          const matchesProductId = pProductId && productIds.some(id => {
            const trimmedId = String(id).trim()
            return trimmedId === pProductId
          })
          
          // Try to match with _id (for backward compatibility)
          const matchesId = pId && productIds.some(id => String(id).trim() === pId)
          
          if (matchesProductId || matchesId) {
            console.log('[Highlighted] ✓ MATCHED product:', {
              name: p.name,
              productId: p.productId,
              matchedProductId: matchesProductId,
              matchedId: matchesId,
              matchingIds: productIds.filter(id => {
                const trimmedId = String(id).trim()
                return trimmedId === pProductId || trimmedId === pId
              })
            })
          }
          
          return matchesProductId || matchesId
        })
        
        console.log('[Highlighted] ===== MATCHING RESULTS =====')
        console.log('[Highlighted] Total products checked:', productsToUse.length)
        console.log('[Highlighted] Highlighted product IDs from backend:', productIds)
        console.log('[Highlighted] Found matching products:', highlightedProductsList.length)
        console.log('[Highlighted] Matched products:', highlightedProductsList.map(p => ({ name: p.name, productId: p.productId })))
        
        if (highlightedProductsList.length === 0) {
          console.error('[Highlighted] ERROR: No products matched!')
          console.error('[Highlighted] Backend product IDs:', productIds)
          console.error('[Highlighted] Available product IDs in products:', productsToUse.map(p => p.productId))
          console.error('[Highlighted] This means the product IDs in highlighted products do not match any existing products.')
          console.error('[Highlighted] Note: Product ID matching is now case-sensitive. Make sure the IDs match exactly.')
        }
        
        // Sort by the order in productIds array (exact match, case-sensitive)
        highlightedProductsList.sort((a, b) => {
          const aId = (a.productId || a._id)?.toString().trim()
          const bId = (b.productId || b._id)?.toString().trim()
          const indexA = productIds.findIndex(id => String(id).trim() === aId)
          const indexB = productIds.findIndex(id => String(id).trim() === bId)
          return indexA - indexB
        })
      }
      
      console.log('[Highlighted] Setting highlighted products:', highlightedProductsList.map(p => p.name))
      setHighlightedProducts(highlightedProductsList)
      console.log('[Highlighted] ===== FETCH COMPLETE =====')
    } catch (err) {
      console.error('[Highlighted] ===== ERROR =====')
      console.error('[Highlighted] Error fetching highlighted products:', err)
      console.error('[Highlighted] Error stack:', err.stack)
      setHighlightedProducts([])
    }
  }

  useEffect(() => {
    console.log('[Highlighted] Component mounted, fetching products...')
    fetchProducts()
    fetchCategories()
    fetchCartCount()
    // Don't call fetchHighlightedProducts here - it will be called after products are loaded
  }, [])

  // Refresh highlighted products when products change
  useEffect(() => {
    console.log('[Highlighted] Products state changed. Current products.length:', products.length)
    if (products.length > 0) {
      console.log('[Highlighted] Products available, calling fetchHighlightedProducts. Products count:', products.length)
      console.log('[Highlighted] First product sample:', products[0] ? {
        name: products[0].name,
        productId: products[0].productId,
        seller: products[0].seller
      } : 'No products')
      // Use a small delay to ensure products are fully set
      const timer = setTimeout(() => {
        console.log('[Highlighted] Timer fired, calling fetchHighlightedProducts')
        fetchHighlightedProducts(products)
      }, 200)
      return () => clearTimeout(timer)
    } else {
      console.log('[Highlighted] No products yet, clearing highlighted products')
      setHighlightedProducts([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Fetch all products without pagination limits
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch products')
      }
      
      const data = await response.json()
      const productsList = data.products || []
      console.log('[Products] Products fetched from API, count:', productsList.length)
      console.log('[Products] Total products available:', data.pagination?.total || productsList.length)
      
      if (productsList.length > 0) {
        console.log('[Products] First product from API:', {
          name: productsList[0].name,
          productId: productsList[0].productId,
          category: productsList[0].category,
          seller: productsList[0].seller,
          sellerType: typeof productsList[0].seller,
          photo: productsList[0].photo,
          photos: productsList[0].photos,
          photosCount: productsList[0].photos ? productsList[0].photos.length : 0
        })
        
        // Log categories found
        const categoriesFound = [...new Set(productsList.map(p => p.category).filter(Boolean))]
        console.log('[Products] Categories found in products:', categoriesFound)
      }
      setProducts(productsList)
      
      // Fetch highlighted products after products are loaded
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        console.log('[Highlighted] setTimeout fired, calling fetchHighlightedProducts with products list')
        fetchHighlightedProducts(productsList)
      }, 300)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    // Exclude electronics and clothing categories
    const categoryLower = product.category?.toLowerCase() || ''
    if (categoryLower === 'electronics' || categoryLower === 'clothing') {
      return false
    }
    
    if (!externalSearchTerm) return true
    
    const searchLower = externalSearchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower))
    )
  })

  // Group products by category, ensuring all products are included
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    // Handle products with missing or null categories
    const categoryName = product.category || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {})
  
  // Sort products within each category by displayOrder
  Object.keys(productsByCategory).forEach(category => {
    productsByCategory[category].sort((a, b) => {
      const orderA = a.displayOrder !== undefined ? a.displayOrder : 999999;
      const orderB = b.displayOrder !== undefined ? b.displayOrder : 999999;
      return orderA - orderB;
    });
  });
  
  // Log category information for debugging
  console.log('[Products] Products grouped by category:', Object.keys(productsByCategory).map(cat => ({
    category: cat,
    count: productsByCategory[cat].length
  })))

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading products...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        <div>Error: {error}</div>
        <button 
          onClick={fetchProducts}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dc2626', background: 'white', color: '#dc2626', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  // Debug: Always log the state
  console.log('[Highlighted Render] State check:', {
    highlightedProductsCount: highlightedProducts.length,
    hasSearchTerm: !!externalSearchTerm,
    searchTermValue: externalSearchTerm,
    willRender: highlightedProducts.length > 0,
    highlightedProducts: highlightedProducts.map(p => ({ name: p.name, productId: p.productId, _id: p._id }))
  })

  return (
    <>
      {/* Highlighted Products Section - Show when we have highlighted products */}
      {highlightedProducts.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ 
            marginBottom: '1.5rem', 
            color: '#0f172a', 
            fontSize: '1.5rem',
            fontWeight: '700',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.75rem',
            textAlign: 'center'
          }}>
            Highlighted Products
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
            onTouchStart={handleHighlightedTouchStart}
            onTouchMove={handleHighlightedTouchMove}
            onTouchEnd={handleHighlightedTouchEnd}
          >
            {/* Left arrow button */}
            {highlightedProducts.length > 1 && (
              <button
                className="highlighted-nav-button"
                onClick={() => {
                  setCurrentHighlightedIndex(prev => prev > 0 ? prev - 1 : highlightedProducts.length - 1)
                }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#0f172a',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffffff'
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.color = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.color = '#0f172a'
                }}
              >
                ‹
              </button>
            )}
            <div
              style={{
                display: 'flex',
                width: '100%',
                maxWidth: '500px',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {highlightedProducts.map((product, index) => {
                if (index !== currentHighlightedIndex) return null
                
                return (
                  <div
                    key={product._id || index}
                    onClick={() => {
                      if (!product?._id) return
                      navigate(`/product/${product._id}`, {
                        state: { from: location.pathname }
                      })
                    }}
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      background: '#f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <img
                      src={resolveImageUrl(
                        product.photos?.[0] ||
                        product.photo ||
                        product.image
                      ) || getPlaceholderImage()}
                      alt={product.name || 'Highlighted Product'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage()
                      }}
                    />
                    {/* Product name overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                        color: 'white',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {product.name}
                      </div>
                      {product.price && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          ₹{product.discountedPrice && product.discountedPrice < product.price 
                            ? product.discountedPrice 
                            : product.price}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Right arrow button */}
            {highlightedProducts.length > 1 && (
              <button
                className="highlighted-nav-button"
                onClick={() => {
                  setCurrentHighlightedIndex(prev => prev < highlightedProducts.length - 1 ? prev + 1 : 0)
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#0f172a',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffffff'
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.color = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.color = '#0f172a'
                }}
              >
                ›
              </button>
            )}
          </div>
          {/* Index indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem',
            fontSize: '1rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            {currentHighlightedIndex + 1} / {highlightedProducts.length}
          </div>
        </div>
      )}

      {Object.keys(productsByCategory).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          {externalSearchTerm ? 'No products found matching your search.' : 'No products available.'}
        </div>
      ) : (
        // Show all categories that have products, regardless of categories API response
        Object.keys(productsByCategory).map(categoryName => {
          const categoryProducts = productsByCategory[categoryName]
          if (!categoryProducts || categoryProducts.length === 0) return null

          const isExpanded = expandedCategories[categoryName] || false
          const productsToShow = isExpanded ? categoryProducts : categoryProducts.slice(0, 4)
          const hasMoreProducts = categoryProducts.length > 4

          return (
            <div key={categoryName} style={{ marginBottom: '4rem' }}>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                color: '#0f172a', 
                fontSize: '1.5rem',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '0.75rem'
              }}>
                {categoryName}
              </h2>
              
              <div className="products-grid">
                {productsToShow.map(product => (
                  <ProductCard 
                    key={product._id} 
                    product={product}
                    onClick={() => {
                      if (!product?._id) return
                      navigate(`/product/${product._id}`, {
                        state: { from: location.pathname }
                      })
                    }}
                  />
                ))}
              </div>

              {hasMoreProducts && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '0',
                  paddingTop: '0'
                }}>
                  <button
                    onClick={() => {
                      setExpandedCategories(prev => ({
                        ...prev,
                        [categoryName]: !isExpanded
                      }))
                    }}
                    style={{
                      padding: '0.875rem 2.5rem',
                      borderRadius: '10px',
                      border: '2px solid #3b82f6',
                      background: 'white',
                      color: '#3b82f6',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#3b82f6'
                      e.target.style.color = 'white'
                      e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.2)'
                      e.target.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white'
                      e.target.style.color = '#3b82f6'
                      e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)'
                      e.target.style.transform = 'translateY(0)'
                    }}
                  >
                    {isExpanded ? (
                      <>
                        <span>See Less</span>
                        <span>↑</span>
                      </>
                    ) : (
                      <>
                        <span>See More</span>
                        <span>↓</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}

      <style>{responsiveGridStyles}</style>
    </>
  )
}

function ProductCard({ product, onClick }) {
  let displayPrice, hasDiscount;
  const primaryPhoto =
    product.image ||
    (product.photos && product.photos.length > 0 && product.photos[0]) ||
    product.photo ||
    null;
  const imageSrc = resolveImageUrl(primaryPhoto) || getPlaceholderImage();
  
  if (product.hasVariations && product.variants && product.variants.length > 0) {
    const prices = product.variants
      .filter(v => v.stock === 'in_stock')
      .map(v => v.discountedPrice && v.discountedPrice < v.price ? v.discountedPrice : v.price);
    
    if (prices.length === 0) {
      displayPrice = null;
    } else {
      const minPrice = Math.min(...prices);
      displayPrice = minPrice;
      hasDiscount = false;
    }
  } else {
    if (product.stockStatus === 'out_of_stock') {
      displayPrice = null;
      hasDiscount = false;
    } else {
      displayPrice = product.discountedPrice && product.discountedPrice < product.price 
        ? product.discountedPrice 
        : product.price;
      hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
    }
  }

  const productPct = getProductDiscountPct(product)

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
    }}
    >
      {productPct > 0 && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: '#dc2626',
          color: 'white',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          zIndex: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          {productPct}%
        </div>
      )}
      {primaryPhoto ? (
        <div style={{ marginBottom: '1rem', textAlign: 'center', flexShrink: 0 }}>
          <img 
            src={imageSrc} 
            alt={product.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = getPlaceholderImage()
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: '1rem', textAlign: 'center', flexShrink: 0, height: '200px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No Image</span>
        </div>
      )}
      
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '1.1rem', 
        fontWeight: '600',
        color: '#0f172a',
        flexShrink: 0
      }}>
        {product.name}
        {product.unit && (
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', marginLeft: '0.25rem' }}>
            ({product.unit})
          </span>
        )}
      </h3>

      {product.hasVariations && product.attributes && product.attributes.length > 0 && (
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#3b82f6',
          marginBottom: '0.5rem',
          fontWeight: '500',
          background: '#eff6ff',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          display: 'inline-block',
          flexShrink: 0
        }}>
          {product.attributes.length === 1 
            ? `Available in different ${product.attributes[0].name}s`
            : `Available in different ${product.attributes.map(attr => attr.name).join(', ')}`
          }
        </div>
      )}
      
      <div style={{ marginBottom: '1rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {displayPrice === null ? (
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#dc2626',
            background: '#fef2f2',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            Out of Stock
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: '700', 
                color: '#059669' 
              }}>
                ₹{displayPrice}
              </span>
              {hasDiscount && (
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b', 
                  textDecoration: 'line-through' 
                }}>
                  ₹{product.price}
                </span>
              )}
            </div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#dc2626', 
                fontWeight: '600' 
              }}>
                Save ₹{(product.price - product.discountedPrice).toFixed(2)}
              </div>
            )}
            {product.hasVariations && product.variants && product.variants.length > 0 && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#64748b',
                fontStyle: 'italic',
                marginTop: '0.25rem'
              }}>
                Starting from ₹{displayPrice}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ 
        fontSize: '0.8rem', 
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Click to view details
      </div>
    </div>
  )
}

