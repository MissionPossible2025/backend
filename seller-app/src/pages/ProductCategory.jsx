import { useState } from "react";
import ProductForm from "./ProductForm";

export default function ProductCategory({ category }) {
  const [products, setProducts] = useState([]);

  // For now, we can start with a single empty product for demo
  const addProduct = () => {
    setProducts([
      ...products,
      { id: Date.now(), name: "", description: "", stock: 0, price: 0, discount: 0, photo: "" },
    ]);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>{category} Products</h3>
      <button onClick={addProduct}>Add Item</button>

      {products.map((prod) => (
        <ProductForm key={prod.id} product={prod} />
      ))}
    </div>
  );
}
