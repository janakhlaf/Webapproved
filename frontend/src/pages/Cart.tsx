import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Film, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../hooks/useCart';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const films = cartItems.filter((item) => item.itemType === 'film');
  const assets = cartItems.filter((item) => item.itemType === 'asset');

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart /> My Cart
        </h1>

        {cartItems.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* LEFT SIDE */}
            <div className="xl:col-span-2 space-y-6">

              {/* FILMS */}
              {films.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Film /> Films <Badge>{films.length}</Badge>
                  </h2>

                  {films.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 border rounded mb-3">
                      <div>
                        <h3>{item.title}</h3>
                        <p>${item.price}</p>
                      </div>

                      <Button onClick={() => removeFromCart(item.id)}>
                        <Trash2 /> Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}

              {/* ASSETS */}
              {assets.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package /> Assets <Badge>{assets.length}</Badge>
                  </h2>

                  {assets.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 border rounded mb-3">
                      <div>
                        <h3>{item.title}</h3>
                        <p>${item.price}</p>
                      </div>

                      <Button onClick={() => removeFromCart(item.id)}>
                        <Trash2 /> Remove
                      </Button>
                    </div>
                  ))}
                </section>
              )}

            </div>

            {/* RIGHT SIDE */}
            <div className="border p-5 rounded-lg">

              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <p>Films: {films.length}</p>
              <p>Assets: {assets.length}</p>

              <h3 className="text-xl font-bold mt-3 mb-4">
                Total: ${totalPrice.toFixed(2)}
              </h3>

              <Button
                className="w-full mb-2"
                onClick={() => setShowCheckout(true)}
              >
                Proceed to Checkout
              </Button>

              <Button variant="outline" className="w-full" onClick={clearCart}>
                Clear Cart
              </Button>

              {/* CHECKOUT FORM */}
              {showCheckout && (
                <div className="mt-6 border p-4 rounded space-y-4">

                  <h3 className="font-semibold text-lg">Credit Card Details</h3>

                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2 border rounded"
                    />

                    <input
                      type="text"
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  {/* BILLING */}
                  <h3 className="font-semibold text-lg mt-4">Billing Details</h3>

                  <input
                    type="text"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="Address"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-2 border rounded"
                  />

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (
                          !cardName ||
                          !cardNumber ||
                          !expiryDate ||
                          !cvv ||
                          !country ||
                          !city ||
                          !addressLine ||
                          !postalCode
                        ) {
                          alert("Please fill all fields");
                          return;
                        }

                        alert("Payment Successful 🎉");
                        clearCart();
                        setShowCheckout(false);
                      }}
                    >
                      Confirm Payment
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCheckout(false)}
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