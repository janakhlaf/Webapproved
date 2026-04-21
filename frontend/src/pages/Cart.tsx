import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Film, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../hooks/useCart';
import { ROUTE_PATHS } from '@/lib/index';

type PurchasedItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  itemType: 'film' | 'asset';
  videoUrl?: string;
  downloadUrl?: string;
};

export default function Cart() {
  const navigate = useNavigate();
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

  const handleSuccessfulPayment = () => {
    try {
      const existingPurchased: PurchasedItem[] = JSON.parse(
        localStorage.getItem('purchased_items') || '[]'
      );

      const purchasedFromCart: PurchasedItem[] = cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        price: item.price,
        image: item.image,
        itemType: item.itemType,
        videoUrl: item.itemType === 'film' ? item.image : undefined,
        downloadUrl: item.image,
      }));

      localStorage.setItem(
        'purchased_items',
        JSON.stringify([...existingPurchased, ...purchasedFromCart])
      );

      clearCart();
      setShowCheckout(false);
      alert('✅ Payment Successful 🎉');
      navigate(ROUTE_PATHS.MY_LIBRARY);
    } catch (error) {
      console.error('Payment save error:', error);
      alert('❌ Something went wrong while saving your purchase.');
    }
  };

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
            <div className="xl:col-span-2 space-y-6">
              {films.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Film /> Films <Badge>{films.length}</Badge>
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
                    <Package /> Assets <Badge>{assets.length}</Badge>
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
                onClick={() => setShowCheckout(true)}
              >
                Proceed to Checkout
              </Button>

              <Button variant="outline" className="w-full" onClick={clearCart}>
                Clear Cart
              </Button>

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
                          alert('Please fill all fields');
                          return;
                        }

                        if (cardNumber === '4242424242424242') {
                          handleSuccessfulPayment();
                        } else if (cardNumber === '4000000000009995') {
                          alert('❌ Insufficient Funds');
                        } else if (cardNumber === '4000000000000002') {
                          alert('❌ Card Declined');
                        } else {
                          alert('❌ Invalid Card Details');
                        }
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