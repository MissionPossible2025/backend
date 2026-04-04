import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const extractPath = join(__dirname, '../src/components/_extract.js')
let s = fs.readFileSync(extractPath, 'utf8')

const header = `import { useEffect } from 'react'
import { useBackButton } from '../hooks/useBackButton.js'
import resolveImageUrl, { getPlaceholderImage } from '../utils/imageUtils.js'
import { getProductDiscountPct, getVariantDiscountPct, getUniqueValidPhotos } from '../utils/productDetailHelpers.js'

`

s = s.replace(
  /function ProductDetailModal\(\{[\s\S]*?\}\) \{/,
  `export default function ProductDetailPanel({
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
}) {`
)

s = header + s
s = s.replace(/getProductDiscountPct,\s*\n\s*getVariantDiscountPct\s*\n/gm, '')
s = s.replace(/onClose/g, 'onBack')
s = s.replace(
  /useBackButton\('product-detail-modal', !!product, onBack\)/,
  "useBackButton('product-detail-page', !!product, onBack)"
)

s = s.replace(
  /\n  \/\/ Prevent body scroll when modal is open\n  useEffect\(\(\) => \{[\s\S]*?\}, \[product\]\)\n/,
  '\n'
)

const overlayBlock =
  /<div \s*\n\s*className="product-detail-modal-overlay"[\s\S]*?<div \s*\n\s*className="product-detail-modal-container"[\s\S]*?onClick=\{\(e\) => e.stopPropagation\(\)\}\s*>\s*\n\s*<button[\s\S]*?<\/button>\s*\n/

const replacement = `<div className="product-detail-page-root" style={{ minHeight: '100dvh', background: '#f8fafc', paddingBottom: 'var(--safe-bottom)', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 'min(800px, 100%)', margin: '0 auto', padding: '0 1rem 2rem', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" onClick={onBack} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
          </div>
        <div 
          className="product-detail-modal-container"
          style={{ position: 'relative' }}
        >
`

if (!overlayBlock.test(s)) {
  console.error('Overlay block not found')
  process.exit(1)
}
s = s.replace(overlayBlock, replacement)

// Remove extra closing </div> that matched old overlay (one less wrapper)
s = s.replace(/\n      <\/div>\n      <\/div>\n    <\/>\n  \)\n\}/, '\n      </div>\n      </div>\n    </>\n  )\n}')

const out = join(__dirname, '../src/components/ProductDetailPanel.jsx')
fs.writeFileSync(out, s)
console.log('Wrote', out, s.length)
