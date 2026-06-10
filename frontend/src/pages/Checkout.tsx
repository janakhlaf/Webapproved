import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const validateForm = () => {
    if (!cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvc.trim()) {
      return "Please fill in all card details.";
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
      return "Card number must be 16 digits.";
    }

    if (cvc.length < 3) {
      return "CVC must be at least 3 digits.";
    }

    return "";
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user?.id) {
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(user.id),
          cart_items: cartItems,
        }),
      });

      console.log("CHECKOUT STATUS:", response.status);
      console.log("CHECKOUT RESPONSE:", await response.clone().text());

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      clearCart();
      navigate(ROUTE_PATHS.MY_LIBRARY);
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong while completing your purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03050a] text-white px-4 py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#080c14]/75 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
          <h1 className="text-2xl font-bold mb-6 text-white tracking-wide border-b border-cyan-500/10 pb-2">Checkout</h1>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium mb-2 text-gray-300 font-mono">
                Card Number
              </label>

              <input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="4242424242424242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/20 bg-[#080c14] text-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
              />
            </div>

            <div>
              <label htmlFor="cardName" className="block text-sm font-medium mb-2 text-gray-300 font-mono">
                Cardholder Name
              </label>

              <input
                id="cardName"
                type="text"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/20 bg-[#080c14] text-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium mb-2 text-gray-300 font-mono">
                  Expiry Date
                </label>

                <input
                  id="expiry"
                  type="text"
                  placeholder="12/28"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#080c14] text-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                />
              </div>

              <div>
                <label htmlFor="cvc" className="block text-sm font-medium mb-2 text-gray-300 font-mono">
                  CVC
                </label>

                <input
                  id="cvc"
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#080c14] text-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="w-full h-12 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] border-none transition-all duration-200"
            >
              {loading ? "Processing..." : "Pay Now"}
            </Button>
          </form>
        </div>

        <div className="bg-[#080c14]/75 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.85)] h-fit">
          <h2 className="text-xl font-bold mb-6 text-white border-b border-cyan-500/10 pb-2">Order Summary</h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-400 font-mono">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-[#080c14]/50 border border-cyan-500/10 rounded-xl p-3"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg border border-white/5"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-cyan-300 font-mono mt-1">{item.category}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize font-mono">{item.itemType}</p>
                  </div>

                  <div className="font-semibold text-cyan-300 font-mono">${item.price}</div>
                </div>
              ))}

              <div className="border-t border-cyan-500/15 pt-4 flex items-center justify-between text-lg font-bold text-cyan-300 font-mono">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}