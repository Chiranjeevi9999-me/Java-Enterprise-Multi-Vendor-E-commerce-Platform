import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('shopstack_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('shopstack_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantityToAdd = 1) => {
    if (!product || product.stockQuantity <= 0) {
      alert(`Sorry, "${product?.title || 'This item'}" is currently Out of Stock.`);
      return false;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const maxStock = product.stockQuantity;
        const newQty = Math.min(currentQty + quantityToAdd, maxStock);
        
        if (currentQty >= maxStock) {
          alert(`Maximum available stock of ${maxStock} units already added to your cart.`);
        }

        const updated = [...prevCart];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        const initialQty = Math.min(quantityToAdd, product.stockQuantity);
        return [...prevCart, { product, quantity: initialQty }];
      }
    });

    setIsCartOpen(true);
    return true;
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stockQuantity;
          const validQty = Math.max(1, Math.min(newQuantity, maxStock));
          return { ...item, quantity: validQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cart.reduce((acc, item) => {
    const price = item.product.discountPrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
