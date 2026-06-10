import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Film, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../hooks/useCart";
import { ROUTE_PATHS } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";

export default function Cart() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { cartItems, removeFromCart, clearCart } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");

  const showPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);

    setTimeout(() => {
      setPopupMessage("");
    }, 2500);
  };

  const films = cartItems.filter((item) => item.itemType === "film");
  const assets = cartItems.filter((item) => item.itemType === "asset");

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const validatePaymentForm = () => {
    const errors: Record<string, string> = {};

    if (!cardName.trim()) errors.cardName = "Please enter cardholder name";
    if (!cardNumber.trim()) errors.cardNumber = "Please enter card number";
    if (!expiryDate.trim()) errors.expiryDate = "Please enter expiry date";
    if (!cvv.trim()) errors.cvv = "Please enter CVV";
    if (!country.trim()) errors.country = "Please enter country";
    if (!city.trim()) errors.city = "Please enter city";
    if (!addressLine.trim()) errors.addressLine = "Please enter address";
    if (!postalCode.trim()) errors.postalCode = "Please enter postal code";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const inputClass = (field: string) =>
    `w-full p-2.5 px-3.5 rounded-lg bg-[#080c14] text-white border outline-none transition-all focus:ring-1 ${
      formErrors[field]
        ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500"
        : "border-cyan-500/20 focus:ring-cyan-400/20 focus:border-cyan-400"
    }`;

  const handleSuccessfulPayment = async () => {
    if (!isAuthenticated || !user?.id) {
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

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
      setShowCheckout(false);
      showPopup("Payment successful 🎉", "success");

      setTimeout(() => {
        navigate("/library");
      }, 900);
    } catch (error) {
      console.error("Payment save error:", error);
      showPopup("Something went wrong while saving your purchase.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#03050a] text-white">
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className={`relative px-8 py-5 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              popupType === "success"
                ? "bg-[#08141f] border-cyan-500/40 text-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.25)]"
                : "bg-[#1a0d0d] border-red-500/40 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
            }`}
          >
            <p className="font-semibold text-lg">{popupMessage}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3 text-white tracking-wide">
          <ShoppingCart className="w-8 h-8 text-cyan-400" />
          My Cart
        </h1>

        {cartItems.length === 0 ? (
          <p className="text-gray-400 font-mono">Your cart is empty</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {films.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white border-b border-cyan-500/10 pb-2">
                    <Film className="w-5 h-5 text-cyan-400" />
                    Films
                    <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-400/35 px-2 py-0.5 font-mono ml-2">
                      {films.length}
                    </Badge>
                  </h2>

                  {films.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-[#080c14]/50 backdrop-blur-md border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 rounded-xl mb-3"
                    >
                      <div>
                        <h3 className="font-bold text-white text-lg">{item.title}</h3>
                        <p className="text-cyan-400 font-mono text-sm mt-1">${item.price}</p>
                      </div>

                      <Button 
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 transition-all font-semibold rounded-lg px-4 py-2"
                        variant="default"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}

              {assets.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white border-b border-cyan-500/10 pb-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    Assets
                    <Badge className="bg-purple-950 text-purple-300 border border-purple-400/35 px-2 py-0.5 font-mono ml-2">
                      {assets.length}
                    </Badge>
                  </h2>

                  {assets.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-[#080c14]/50 backdrop-blur-md border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 rounded-xl mb-3"
                    >
                      <div>
                        <h3 className="font-bold text-white text-lg">{item.title}</h3>
                        <p className="text-cyan-400 font-mono text-sm mt-1">${item.price}</p>
                      </div>

                      <Button 
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 transition-all font-semibold rounded-lg px-4 py-2"
                        variant="default"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}
            </div>

            <div className="bg-[#080c14]/75 backdrop-blur-xl border border-cyan-500/15 p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] h-fit">
              <h2 className="text-xl font-bold mb-6 text-white border-b border-cyan-500/10 pb-2">Order Summary</h2>

              <div className="space-y-2 text-sm text-gray-400 font-mono">
                <p className="flex justify-between">
                  <span>Films:</span>
                  <span className="text-white">{films.length}</span>
                </p>
                <p className="flex justify-between">
                  <span>Assets:</span>
                  <span className="text-white">{assets.length}</span>
                </p>
              </div>

              <h3 className="text-2xl font-black mt-6 mb-6 text-cyan-300 font-mono flex justify-between items-baseline border-t border-cyan-500/10 pt-4">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </h3>

              <Button
                className="w-full mb-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] border-none transition-all duration-200 py-5 text-base rounded-xl"
                onClick={() => {
                  setFormErrors({});
                  setShowCheckout(true);
                }}
              >
                Proceed to Checkout
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-300 transition-all duration-200" 
                onClick={clearCart}
              >
                Clear Cart
              </Button>

              {showCheckout && (
                <div className="mt-6 bg-[#03050a]/90 border border-cyan-500/20 p-5 rounded-xl space-y-4 shadow-inner">
                  <h3 className="font-bold text-lg text-white font-mono border-b border-cyan-500/10 pb-2">Credit Card Details</h3>

                  <div>
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.cardName;
                          return updated;
                        });
                      }}
                      className={inputClass("cardName")}
                    />
                    {formErrors.cardName && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.cardName}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.cardNumber;
                          return updated;
                        });
                      }}
                      className={inputClass("cardNumber")}
                    />
                    {formErrors.cardNumber && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => {
                          setExpiryDate(e.target.value);

                          setFormErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.expiryDate;
                            return updated;
                          });
                        }}
                        className={inputClass("expiryDate")}
                      />
                      {formErrors.expiryDate && (
                        <p className="text-red-400 text-xs mt-1 font-mono">
                          {formErrors.expiryDate}
                        </p>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="CVV"
                        value={cvv}
                        onChange={(e) => {
                          setCvv(e.target.value);

                          setFormErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.cvv;
                            return updated;
                          });
                        }}
                        className={inputClass("cvv")}
                      />
                      {formErrors.cvv && (
                        <p className="text-red-400 text-xs mt-1 font-mono">
                          {formErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mt-6 text-white font-mono border-b border-cyan-500/10 pb-2">Billing Details</h3>

                  <div>
                    <input
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.country;
                          return updated;
                        });
                      }}
                      className={inputClass("country")}
                    />
                    {formErrors.country && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.country}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.city;
                          return updated;
                        });
                      }}
                      className={inputClass("city")}
                    />
                    {formErrors.city && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={addressLine}
                      onChange={(e) => {
                        setAddressLine(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.addressLine;
                          return updated;
                        });
                      }}
                      className={inputClass("addressLine")}
                    />
                    {formErrors.addressLine && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.addressLine}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => {
                        setPostalCode(e.target.value);

                        setFormErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.postalCode;
                          return updated;
                        });
                      }}
                      className={inputClass("postalCode")}
                    />
                    {formErrors.postalCode && (
                      <p className="text-red-400 text-xs mt-1 font-mono">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] border-none transition-all duration-200"
                      onClick={() => {
                        if (!validatePaymentForm()) {
                          return;
                        }

                        const cleanCardNumber = cardNumber.replace(/\s/g, "");

                        if (cleanCardNumber === "4242424242424242") {
                          handleSuccessfulPayment();
                        } else if (cleanCardNumber === "4000000000009995") {
                          showPopup("Insufficient funds.", "error");
                        } else if (cleanCardNumber === "4000000000000002") {
                          showPopup("Card declined.", "error");
                        } else {
                          showPopup("Invalid card details.", "error");
                        }
                      }}
                    >
                      Confirm Payment
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-300"
                      onClick={() => {
                        setShowCheckout(false);
                        setFormErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}