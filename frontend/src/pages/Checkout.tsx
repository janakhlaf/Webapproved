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
          downloadUrl: item.videoUrl || item.image,
        }));

        localStorage.setItem(
          'purchased_items',
          JSON.stringify([...existingPurchased, ...purchasedFromCart])
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

        <input
          type="text"
          placeholder="Card Number"
          className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          value={cardData.number}
          onChange={(e) =>
            setCardData({ ...cardData, number: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Cardholder Name"
          className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          value={cardData.name}
          onChange={(e) =>
            setCardData({ ...cardData, name: e.target.value })
          }
        />

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="MM/YY"
            className="w-1/2 p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            value={cardData.expiry}
            onChange={(e) =>
              setCardData({ ...cardData, expiry: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="CVV"
            className="w-1/2 p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            value={cardData.cvv}
            onChange={(e) =>
              setCardData({ ...cardData, cvv: e.target.value })
            }
          />
        </div>

        <Button
          onClick={handlePayment}
          className="w-full"
          disabled={status === 'processing'}
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
            ❌ Transaction Declined: Insufficient Funds
          </div>
        )}
      </div>
    </div>
  );
}
