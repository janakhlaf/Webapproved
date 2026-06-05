import { useEffect, useState } from 'react';


export interface CartItem {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  itemType: 'film' | 'asset';
  downloadUrl?: string;
}

const STORAGE_KEY = 'cart_items';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (item: CartItem, userId: number) => {
  try {
    const response = await fetch("http://localhost:8000/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        item_id: Number(item.id.replace("film-", "").replace("asset-", "")),
        item_type: item.itemType,
        price: item.price,
      }),
    });

    console.log("ADD TO CART STATUS:", response.status);
    console.log("ADD TO CART RESPONSE:", await response.clone().text());

    if (!response.ok) {
      throw new Error("Failed to save cart item in database");
    }

    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  } catch (error) {
    console.error("Failed to add item to cart", error);
  }
};

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartCount: cartItems.length,
  };
}