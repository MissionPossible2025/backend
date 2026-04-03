import { useState } from "react";
import ProductForm from "./ProductForm";

export default function ProductCategory({ category }) {
  const [products, setProducts] = useState([]);

  const addProduct = () => {
    setProducts([
      ...products,
      {
        id: Date.now(),
        name: "",
        description: "",
        stock: 0,
        price: 0,
        discount: 0,
        photo: "",
      },
    ]);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>{category} Products</h3>
      <button onClick={addProduct}>Add New Product</button>

      {products.map((prod) => (
        <ProductForm key={prod.id} product={prod} />
      ))}
    </div>
  );
}
