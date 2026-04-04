import { useBackButton } from '../hooks/useBackButton.js'
import resolveImageUrl, { getPlaceholderImage } from '../utils/imageUtils.js'
import { getProductDiscountPct, getVariantDiscountPct, getUniqueValidPhotos } from '../utils/productDetailHelpers.js'

export default function ProductDetailPanel({
  product,
  selectedVariant,
  selectedAttributes,
  quantity,
  currentImageIndex,
  cartMessage,
  onBack,
  onAttributeSelection,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onImageIndexChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) {
  // Register with back button handler
  useBackButton('product-detail-page', !!product, onBack)
  
  
  return (
    <>
      <style>{`
        .product-detail-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          padding-top: max(2rem, calc(var(--safe-top, 0px) + 1rem));
          padding-bottom: max(2rem, calc(var(--safe-bottom, 0px) + 1rem));
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
          box-sizing: border-box;
          margin: 0;
        }
        
        .product-detail-modal-container {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          max-height: calc(100vh - max(4rem, calc(var(--safe-top, 0px) + var(--safe-bottom, 0px) + 2rem)));
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: relative;
          box-sizing: border-box;
        }
        
        .product-detail-modal-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        
        .product-detail-title {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        
        .product-detail-section-title {
          margin: 0 0 1rem 0;
          color: #0f172a;
          font-size: 1.3rem;
          font-weight: 600;
        }
        
        .product-detail-price {
          font-size: 2.5rem;
          font-weight: 700;
          color: #059669;
        }
        
        .product-detail-variant-price {
          font-size: 2rem;
          font-weight: 700;
          color: #059669;
        }
        
        /* Container for product images to ensure consistent sizing */
        .product-detail-image-container {
          width: 100%;
          height: 400px;
          border-radius: 12px;
          background-color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .product-detail-image-container img,
        .product-detail-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          object-position: center;
          user-select: none;
        }
        
        .product-detail-thumbnail {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }
        
        .product-detail-description {
          margin: 0;
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        
        .product-detail-brand {
          font-size: 1.8rem;
          font-weight: 700;
          color: #000000;
          text-align: center;
          padding: 0.75rem 1.5rem;
          border: 2px solid #000000;
          border-radius: 8px;
          background: #ffffff;
        }
        
        @media (max-width: 768px) {
          .product-detail-modal-overlay {
            padding: 0;
            align-items: flex-start;
            padding-top: calc(var(--safe-top, 0px) + 1rem);
            overflow-x: hidden;
            width: 100%;
            max-width: 100%;
          }
          
          .product-detail-modal-container {
            border-radius: 0;
            padding: 1rem;
            padding-top: calc(1rem + 1rem);
            max-width: 100%;
            width: 100%;
            max-height: calc(100dvh - var(--safe-top, 0px) - 2rem);
            height: auto;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            box-sizing: border-box;
            margin-top: 0;
          }
          
          .product-detail-modal-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .product-detail-title {
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
          }
          
          .product-detail-section-title {
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
          }
          
          .product-detail-price {
            font-size: 1.8rem;
          }
          
          .product-detail-variant-price {
            font-size: 1.5rem;
          }
          
          .product-detail-image-container {
            height: 300px;
            max-height: 50vh;
            margin-bottom: 0.75rem;
          }
          
          .product-detail-image {
            height: auto;
            max-height: 100%;
            width: auto;
            max-width: 100%;
          }
          
          .product-detail-thumbnail {
            width: 60px;
            height: 60px;
          }
          
          .product-detail-description {
            font-size: 0.95rem;
            line-height: 1.5;
          }
          
          .product-detail-brand {
            font-size: 1.3rem;
            padding: 0.5rem 1rem;
          }
          
          .product-detail-modal-container button {
            font-size: 0.9rem !important;
            padding: 0.75rem 1rem !important;
          }
          
          .product-detail-modal-container input[type="number"] {
            font-size: 1rem !important;
            padding: 0.5rem !important;
          }
          
          .product-detail-attribute-button {
            font-size: 0.85rem !important;
            padding: 0.4rem 0.75rem !important;
          }
          
          .product-detail-price-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .product-detail-price-grid > div:empty {
            display: none !important;
          }
          
          /* Fix close button position on mobile - move to top-left */
          .product-detail-close-button {
            top: 1rem !important;
            left: 1rem !important;
            right: auto !important;
            z-index: 20 !important;
          }
          
          /* Ensure discount badge stays top-right on mobile and is fully visible */
          .product-detail-discount-badge {
            top: 0.5rem !important;
            right: 0.5rem !important;
            left: auto !important;
            z-index: 15 !important;
          }
          
          /* Add padding to image container to ensure badge visibility */
          .product-detail-modal-content > div:first-child {
            padding-top: 0.5rem;
            margin-top: 0.5rem;
          }
        }
      `}</style>
      <div className="product-detail-page-root" style={{ minHeight: '100dvh', background: '#f8fafc', paddingBottom: 'var(--safe-bottom)', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 'min(800px, 100%)', margin: '0 auto', padding: '0 1rem 2rem', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" onClick={onBack} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
          </div>
        <div 
          className="product-detail-modal-container"
          style={{ position: 'relative' }}
        >
        <div className="product-detail-modal-content">
          {/* Product Images */}
          <div style={{ position: 'relative', paddingTop: '0.5rem' }}>
            {(() => {
              const pct = selectedVariant ? getVariantDiscountPct(selectedVariant) : getProductDiscountPct(product)
              return pct > 0 ? (
                <div 
                  className="product-detail-discount-badge"
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: '#dc2626',
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    zIndex: 15,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                  {pct}%
                </div>
              ) : null
            })()}
            {(() => {
              const uniquePhotos = getUniqueValidPhotos(product)
              return uniquePhotos && uniquePhotos.length > 0
            })() ? (
              <div>
                {(() => {
                  const uniquePhotos = getUniqueValidPhotos(product)
                  const safeIndex = Math.min(currentImageIndex, uniquePhotos.length - 1)
                  const currentPhoto = uniquePhotos[safeIndex]
                  return (
                <div style={{ position: 'relative' }}>
                  <div className="product-detail-image-container">
                    <img 
                      src={resolveImageUrl(currentPhoto)} 
                      alt={product.name}
                      className="product-detail-image"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    />
                  </div>
                  
                  {uniquePhotos.length > 1 && (
                    <>
                      <button
                        onClick={() => onImageIndexChange(prev => prev > 0 ? prev - 1 : uniquePhotos.length - 1)}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => onImageIndexChange(prev => prev < uniquePhotos.length - 1 ? prev + 1 : 0)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                  
                  {uniquePhotos.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '1rem',
                      right: '1rem',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {safeIndex + 1} / {uniquePhotos.length}
                    </div>
                  )}
                </div>
                  )
                })()}
                
                {(() => {
                  const uniquePhotos = getUniqueValidPhotos(product)
                  return uniquePhotos.length > 1 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {uniquePhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={resolveImageUrl(photo)}
                        alt={`${product.name} ${index + 1}`}
                        onClick={() => onImageIndexChange(index)}
                        className="product-detail-thumbnail"
                        style={{
                          border: currentImageIndex === index ? '2px solid #059669' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          opacity: currentImageIndex === index ? 1 : 0.7,
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                ) : null
                })()}
              </div>
            ) : product.photo && (
              <div className="product-detail-image-container">
                <img 
                  src={resolveImageUrl(product.photo)} 
                  alt={product.name}
                  className="product-detail-image"
                />
              </div>
            )}
          </div>
          
          {/* Product Information */}
          <div>
            <h2 className="product-detail-title">
              {product.name}
            </h2>
            
            {product.hasVariations && product.attributes && product.attributes.length > 0 ? (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="product-detail-section-title">
                  Select Options
                </h3>
                
                {product.attributes.map((attribute, attrIndex) => (
                  <div key={attrIndex} style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: '#374151', 
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {attribute.name}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {attribute.options.map((option, optIndex) => {
                        const isSelected = selectedAttributes[attribute.name] === option.name;
                        
                        return (
                          <button
                            key={optIndex}
                            onClick={() => onAttributeSelection(attribute.name, option.name)}
                            className="product-detail-attribute-button"
                            style={{
                              borderRadius: '6px',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              background: isSelected ? '#eff6ff' : 'white',
                              color: isSelected ? '#1d4ed8' : '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontWeight: '500'
                            }}
                          >
                            {option.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {selectedVariant && (
                  <div style={{ 
                    padding: '1rem', 
                    background: '#f0f9ff', 
                    borderRadius: '8px', 
                    border: '1px solid #bae6fd' 
                  }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>
                        Selected: {Object.entries(selectedVariant.combination).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </h4>
                      {selectedVariant.stock === 'out_of_stock' && (
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#dc2626', 
                          fontWeight: '500',
                          background: '#fef2f2',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          Out of Stock
                        </div>
                      )}
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      alignItems: 'center', 
                      marginBottom: '0.5rem', 
                      gap: '1rem'
                    }}
                    className="product-detail-price-grid"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span className="product-detail-variant-price" style={{ 
                            color: selectedVariant.stock === 'out_of_stock' ? '#9ca3af' : '#059669'
                          }}>
                            ₹{selectedVariant.discountedPrice && selectedVariant.discountedPrice < selectedVariant.price 
                              ? selectedVariant.discountedPrice 
                              : selectedVariant.price}
                          </span>
                          {selectedVariant.discountedPrice && selectedVariant.discountedPrice < selectedVariant.price && (
                            <span style={{ 
                              fontSize: '1.2rem', 
                              color: '#64748b', 
                              textDecoration: 'line-through' 
                            }}>
                              ₹{selectedVariant.price}
                            </span>
                          )}
                        </div>
                        {selectedVariant.discountedPrice && selectedVariant.discountedPrice < selectedVariant.price && (
                          <div style={{ 
                            fontSize: '1rem', 
                            color: '#dc2626', 
                            fontWeight: '600',
                            background: '#fef2f2',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            display: 'inline-block',
                            width: 'fit-content'
                          }}>
                            You Save: ₹{(selectedVariant.price - selectedVariant.discountedPrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {product.brand && (
                        <div className="product-detail-brand" style={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          margin: '0 auto'
                        }}>
                          {product.brand}
                        </div>
                      )}
                      
                      <div></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem', 
                  gap: '1rem'
                }}
                className="product-detail-price-grid"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="product-detail-price">
                        ₹{product.discountedPrice && product.discountedPrice < product.price 
                          ? product.discountedPrice 
                          : product.price}
                      </span>
                      {product.discountedPrice && product.discountedPrice < product.price && (
                        <span style={{ 
                          fontSize: '1.5rem', 
                          color: '#64748b', 
                          textDecoration: 'line-through' 
                        }}>
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                    {product.discountedPrice && product.discountedPrice < product.price && (
                      <div style={{ 
                        fontSize: '1.1rem', 
                        color: '#dc2626', 
                        fontWeight: '600',
                        background: '#fef2f2',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        display: 'inline-block',
                        width: 'fit-content'
                      }}>
                        You Save: ₹{(product.price - product.discountedPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {product.brand && (
                    <div className="product-detail-brand" style={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto'
                    }}>
                      {product.brand}
                    </div>
                  )}
                  
                  <div></div>
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="product-detail-section-title">
                Description
              </h3>
              <p className="product-detail-description">
                {product.description}
              </p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="product-detail-section-title">
                Quantity
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    onQuantityChange(Math.max(1, value))
                  }}
                  min="1"
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => onQuantityChange(quantity + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {cartMessage && (
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                background: cartMessage.includes('✅') ? '#f0fdf4' : cartMessage.includes('❌') ? '#fef2f2' : '#fefce8',
                border: cartMessage.includes('✅') ? '1px solid #bbf7d0' : cartMessage.includes('❌') ? '1px solid #fecaca' : '1px solid #fde68a',
                color: cartMessage.includes('✅') ? '#166534' : cartMessage.includes('❌') ? '#dc2626' : '#d97706',
                fontSize: '1rem',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                {cartMessage}
              </div>
            )}

            {(() => {
              const isOutOfStock = product.hasVariations && selectedVariant 
                ? selectedVariant.stock === 'out_of_stock'
                : product.stockStatus === 'out_of_stock'
              
              return (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={onAddToCart}
                    disabled={isOutOfStock}
                    style={{
                      flex: 1,
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: isOutOfStock ? '#d1d5db' : '#3b82f6',
                      background: isOutOfStock ? '#f3f4f6' : 'white',
                      color: isOutOfStock ? '#9ca3af' : '#3b82f6',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: isOutOfStock ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.background = '#3b82f6';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.background = 'white';
                        e.target.style.color = '#3b82f6';
                      }
                    }}
                  >
                    {isOutOfStock ? '❌ Out of Stock' : '🛒 Add to Cart'}
                  </button>
                  
                  <button 
                    onClick={onBuyNow}
                    disabled={isOutOfStock}
                    style={{
                      flex: 1,
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isOutOfStock ? '#9ca3af' : '#059669',
                      color: 'white',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: isOutOfStock ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.background = '#047857';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.background = '#059669';
                      }
                    }}
                  >
                    {isOutOfStock ? '❌ Out of Stock' : '🛍️ Buy Now'}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
        </div>
      </div>
      </div>
    </>
  )
}