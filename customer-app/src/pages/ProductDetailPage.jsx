import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { getCurrentUser, getUserId, getUserObject, isProfileComplete } from '../utils/userUtils'
import ProductDetailPanel from '../components/ProductDetailPanel.jsx'
import ProfileModal from '../components/ProfileModal.jsx'
import { getUniqueValidPhotos } from '../utils/productDetailHelpers.js'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart: addToCartHook } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [pendingBuyNow, setPendingBuyNow] = useState(null)

  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Return to the screen we opened from (dashboard with search/highlighted/menu, or /products).
  // Do not use navigate(-1): history can include /auth after login, which sends users to login.
  // Do not call dispatchBackButton() here — global back invokes this as onClose and would recurse.
  const handleBack = () => {
    const from = location.state?.from
    const safe =
      typeof from === 'string' &&
      from.length > 0 &&
      from !== '/auth' &&
      !from.startsWith('/auth')
    navigate(safe ? from : '/dashboard')
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!productId) {
        setError('Missing product')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${productId}`
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Product not found')
        }
        const data = await res.json()
        if (!cancelled) {
          setProduct(data)
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    if (product && product.hasVariations && product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0]
      setSelectedVariant(firstVariant)
      const defaultAttributes = {}
      if (firstVariant.combination) {
        Object.entries(firstVariant.combination).forEach(([attr, value]) => {
          defaultAttributes[attr] = value
        })
      }
      setSelectedAttributes(defaultAttributes)
    } else {
      setSelectedVariant(null)
      setSelectedAttributes({})
    }
    setQuantity(1)
    setCurrentImageIndex(0)
  }, [product])

  const handleAttributeSelection = (attributeName, optionName) => {
    const newSelectedAttributes = { ...selectedAttributes, [attributeName]: optionName }
    setSelectedAttributes(newSelectedAttributes)
    if (product?.variants) {
      const matchingVariant = product.variants.find((variant) =>
        Object.entries(newSelectedAttributes).every(
          ([attr, value]) => variant.combination && variant.combination[attr] === value
        )
      )
      setSelectedVariant(matchingVariant || null)
    }
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !product) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    const uniquePhotos = getUniqueValidPhotos(product)
    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev < uniquePhotos.length - 1 ? prev + 1 : 0))
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : uniquePhotos.length - 1))
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    if (product.hasVariations && product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        setCartMessage('Please select a variant before adding to cart')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }
    }
    const result = await addToCartHook(product, quantity, selectedVariant)
    if (result.success) {
      setCartMessage(`✅ ${result.message}`)
      setTimeout(() => setCartMessage(''), 3000)
      setQuantity(1)
    } else {
      setCartMessage(`❌ ${result.message}`)
      setTimeout(() => setCartMessage(''), 3000)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    try {
      const isOutOfStock =
        product.hasVariations && selectedVariant
          ? selectedVariant.stock === 'out_of_stock'
          : product.stockStatus === 'out_of_stock'

      if (isOutOfStock) {
        setCartMessage('❌ This product is out of stock')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      if (product.hasVariations && product.variants && product.variants.length > 0) {
        if (!selectedVariant) {
          setCartMessage('Please select a variant before buying')
          setTimeout(() => setCartMessage(''), 3000)
          return
        }
      }

      const user = getCurrentUser()
      if (!user) {
        setCartMessage('Please log in to proceed with purchase')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      const userId = getUserId(user)
      if (!userId) {
        setCartMessage('❌ User ID not found. Please log in again.')
        setTimeout(() => setCartMessage(''), 3000)
        return
      }

      let actualUser = getUserObject(user)
      if (actualUser?._id) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${actualUser._id}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          )
          if (response.ok) {
            const data = await response.json()
            if (data && typeof data === 'object') {
              actualUser = data.customer || data.user || data
              const updatedUserData = { ...user }
              if (updatedUserData.customer) updatedUserData.customer = actualUser
              else if (updatedUserData.user) updatedUserData.user = actualUser
              localStorage.setItem('user', JSON.stringify(updatedUserData))
            }
          }
        } catch (err) {
          console.error('Error fetching user:', err)
        }
      }

      let displayPrice
      let itemPrice
      let itemDiscountedPrice
      if (product.hasVariations && selectedVariant) {
        itemPrice = selectedVariant.price
        itemDiscountedPrice = selectedVariant.discountedPrice
        displayPrice =
          itemDiscountedPrice && itemDiscountedPrice < itemPrice ? itemDiscountedPrice : itemPrice
      } else {
        itemPrice = product.price
        itemDiscountedPrice = product.discountedPrice
        displayPrice =
          itemDiscountedPrice && itemDiscountedPrice < itemPrice ? itemDiscountedPrice : itemPrice
      }

      const totalAmount = displayPrice * quantity

      const orderData = {
        user: {
          name: actualUser?.name || '',
          phone: actualUser?.phone || '',
          email: actualUser?.email || '',
          address: actualUser?.address || {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          }
        },
        cart: {
          items: [
            {
              product,
              quantity,
              price: itemPrice,
              discountedPrice: itemDiscountedPrice,
              variant: selectedVariant
                ? {
                    combination: selectedVariant.combination,
                    price: selectedVariant.price,
                    originalPrice: selectedVariant.originalPrice,
                    stock: selectedVariant.stock
                  }
                : null
            }
          ]
        },
        totalAmount,
        isBuyNow: true
      }

      if (!isProfileComplete(user)) {
        setPendingBuyNow({ product, selectedVariant, quantity, orderData })
        setShowProfileModal(true)
        setCartMessage('⚠️ Please complete your profile to proceed with checkout')
        setTimeout(() => setCartMessage(''), 5000)
        return
      }

      navigate('/order-summary', { state: { orderData } })
    } catch (err) {
      setCartMessage('❌ Failed to proceed with purchase')
      setTimeout(() => setCartMessage(''), 3000)
    }
  }

  const handleProfileModalClose = async () => {
    setShowProfileModal(false)
    if (pendingBuyNow) {
      setTimeout(async () => {
        try {
          const user = getCurrentUser()
          let actualUser = getUserObject(user)
          if (actualUser?._id) {
            try {
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/customers/${actualUser._id}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
              )
              if (response.ok) {
                const data = await response.json()
                if (data && typeof data === 'object') {
                  const resolvedUser = data.customer || data.user || data
                  if (resolvedUser && typeof resolvedUser === 'object') actualUser = resolvedUser
                }
              }
            } catch (e) {
              console.error(e)
            }
          }
          const updatedOrderData = {
            ...pendingBuyNow.orderData,
            user: {
              name: actualUser?.name || '',
              phone: actualUser?.phone || '',
              email: actualUser?.email || '',
              address: actualUser?.address || {
                street: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
              }
            }
          }
          setPendingBuyNow(null)
          navigate('/order-summary', { state: { orderData: updatedOrderData } })
        } catch (e) {
          const { orderData } = pendingBuyNow
          setPendingBuyNow(null)
          navigate('/order-summary', { state: { orderData } })
        }
      }, 1000)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc'
        }}
      >
        Loading product…
      </div>
    )
  }

  if (error || !product) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          padding: '2rem',
          textAlign: 'center',
          background: '#f8fafc',
          paddingBottom: 'var(--safe-bottom)'
        }}
      >
        <p style={{ color: '#dc2626' }}>{error || 'Product not found'}</p>
        <button
          type="button"
          onClick={handleBack}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          ← Go back
        </button>
      </div>
    )
  }

  return (
    <>
      <ProductDetailPanel
        product={product}
        selectedVariant={selectedVariant}
        selectedAttributes={selectedAttributes}
        quantity={quantity}
        currentImageIndex={currentImageIndex}
        cartMessage={cartMessage}
        onBack={handleBack}
        onAttributeSelection={handleAttributeSelection}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onImageIndexChange={setCurrentImageIndex}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {showProfileModal && (
        <ProfileModal isOpen={showProfileModal} onClose={handleProfileModalClose} />
      )}
    </>
  )
}
