/** Discount % from product (seller discountPercent or from variants). */
export const getProductDiscountPct = (product) => {
  if (!product) return 0

  if (product.hasVariations && Array.isArray(product.variants) && product.variants.length > 0) {
    let maxPct = 0
    product.variants.forEach((variant) => {
      const variantPct = getVariantDiscountPct(variant)
      if (variantPct > maxPct) maxPct = variantPct
    })
    return maxPct
  }

  const pct = parseFloat(product.discountPercent) || 0
  return pct > 0 && pct <= 100 ? Math.round(pct) : 0
}

export const getVariantDiscountPct = (variant) => {
  if (!variant) return 0
  if (variant.discountPercent !== undefined && variant.discountPercent !== null) {
    const pct = parseFloat(variant.discountPercent) || 0
    return pct > 0 && pct <= 100 ? Math.round(pct) : 0
  }
  const base = parseFloat(variant.price) || 0
  const disc = parseFloat(variant.discountedPrice) || 0
  if (base > 0 && disc > 0 && disc < base) {
    return Math.round((1 - disc / base) * 100)
  }
  return 0
}

/** Unique non-empty photo URLs (no data: URLs). */
export const getUniqueValidPhotos = (product) => {
  if (!product) return []

  const raw = []
  if (product.photo) raw.push(product.photo)
  if (Array.isArray(product.photos)) raw.push(...product.photos)

  const seen = new Set()
  const result = []

  for (const url of raw) {
    if (!url || typeof url !== 'string') continue
    const trimmed = url.trim()
    if (!trimmed) continue
    if (trimmed.toLowerCase().startsWith('data:image')) continue
    if (!seen.has(trimmed)) {
      seen.add(trimmed)
      result.push(trimmed)
    }
  }

  return result
}
