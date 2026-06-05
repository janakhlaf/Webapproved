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
    `w-full p-2 rounded bg-background outline-none ${
      formErrors[field]
        ? "border border-red-500 focus:ring-2 focus:ring-red-500/40"
        : "border border-border focus:ring-2 focus:ring-primary/40"
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
    <div className="min-h-screen bg-background">
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className={`relative px-8 py-5 rounded-2xl border shadow-2xl ${
              popupType === "success"
                ? "bg-[#08141f] border-cyan-500 text-cyan-300"
                : "bg-[#1a0d0d] border-red-500 text-red-300"
            }`}
          >
            <p className="font-semibold text-lg">{popupMessage}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart />
          My Cart
        </h1>

        {cartItems.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {films.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Film />
                    Films
                    <Badge>{films.length}</Badge>
                  </h2>

                  {films.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-3 border rounded mb-3"
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>${item.price}</p>
                      </div>

                      <Button onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}

              {assets.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package />
                    Assets
                    <Badge>{assets.length}</Badge>
                  </h2>

                  {assets.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-3 border rounded mb-3"
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>${item.price}</p>
                      </div>

                      <Button onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}
            </div>

            <div className="border p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <p>Films: {films.length}</p>
              <p>Assets: {assets.length}</p>

              <h3 className="text-xl font-bold mt-3 mb-4">
                Total: ${totalPrice.toFixed(2)}
              </h3>

              <Button
                className="w-full mb-2"
                onClick={() => {
                  setFormErrors({});
                  setShowCheckout(true);
                }}
              >
                Proceed to Checkout
              </Button>

              <Button variant="outline" className="w-full" onClick={clearCart}>
                Clear Cart
              </Button>

              {showCheckout && (
                <div className="mt-6 border p-4 rounded space-y-4">
                  <h3 className="font-semibold text-lg">Credit Card Details</h3>

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
                      <p className="text-red-400 text-xs mt-1">
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
                      <p className="text-red-400 text-xs mt-1">
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
                        <p className="text-red-400 text-xs mt-1">
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
                        <p className="text-red-400 text-xs mt-1">
                          {formErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mt-4">
                    Billing Details
                  </h3>

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
                      <p className="text-red-400 text-xs mt-1">
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
                      <p className="text-red-400 text-xs mt-1">
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
                      <p className="text-red-400 text-xs mt-1">
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
                      <p className="text-red-400 text-xs mt-1">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
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
                      className="flex-1"
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