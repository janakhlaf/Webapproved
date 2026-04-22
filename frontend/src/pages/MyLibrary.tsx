import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';
import { useCart } from '@/hooks/useCart';

const TEST_CARD = {
  number: '4242424242424242',
  name: 'Test User',
  expiry: '12/30',
  cvv: '123',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const [status, setStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed'
  >('idle');

  const isTestCard = () => {
    return (
      cardData.number.replace(/\s/g, '') === TEST_CARD.number &&
      cardData.name.trim().toLowerCase() === TEST_CARD.name.toLowerCase() &&
      cardData.expiry.trim() === TEST_CARD.expiry &&
      cardData.cvv.trim() === TEST_CARD.cvv
    );
  };

  const handlePayment = () => {
    setStatus('processing');

    setTimeout(() => {
      if (isTestCard()) {
        const existingPurchased = JSON.parse(
          localStorage.getItem('purchased_items') || '[]'
        );

        const purchasedFromCart = cartItems.map((item) => ({
          ...item,
          image: item.image,
          videoUrl: item.videoUrl || '',
          downloadUrl:
            item.itemType === 'asset'
              ? item.downloadUrl || ''
              : item.videoUrl || '',
        }));

        const mergedPurchasedItems = [...existingPurchased];

        purchasedFromCart.forEach((newItem) => {
          const exists = mergedPurchasedItems.some(
            (existingItem) => existingItem.id === newItem.id
          );

          if (!exists) {
            mergedPurchasedItems.push(newItem);
          }
        });

        localStorage.setItem(
          'purchased_items',
          JSON.stringify(mergedPurchasedItems)
        );

        clearCart();
        setStatus('success');

        setTimeout(() => {
          navigate(ROUTE_PATHS.MY_LIBRARY);
        }, 1000);
      } else {
        setStatus('failed');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-6 bg-card rounded-2xl shadow-xl space-y-5 border border-border/30">
        <h2 className="text-2xl font-bold text-center">Checkout</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Card Number</label>
            <input
              type="text"
              placeholder="Card Number"
              title="Card Number"
              className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              value={cardData.number}
              onChange={(e) =>
                setCardData({ ...cardData, number: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="Cardholder Name"
              title="Cardholder Name"
              className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              value={cardData.name}
              onChange={(e) =>
                setCardData({ ...cardData, name: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-2">Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                title="Expiry Date"
                className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                value={cardData.expiry}
                onChange={(e) =>
                  setCardData({ ...cardData, expiry: e.target.value })
                }
              />
            </div>

            <div className="w-1/2">
              <label className="block text-sm font-medium mb-2">CVV</label>
              <input
                type="text"
                placeholder="CVV"
                title="CVV"
                className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                value={cardData.cvv}
                onChange={(e) =>
                  setCardData({ ...cardData, cvv: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          className="w-full"
          disabled={status === 'processing' || cartItems.length === 0}
        >
          {status === 'processing' ? 'Processing...' : 'Pay Now'}
        </Button>

        {status === 'success' && (
          <div className="text-center text-green-500 font-medium">
            ✅ Payment Successful
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center text-red-500 font-medium">
            ❌ Transaction Declined: Invalid Test Card
          </div>
        )}
      </div>
    </div>
  );
}