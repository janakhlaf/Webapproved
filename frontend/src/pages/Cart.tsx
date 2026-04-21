import { motion } from 'framer-motion';
import { ShoppingCart, Film, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '../hooks/useCart';
import { useNavigate } from "react-router-dom";
import { Badge } from '@/components/ui/badge';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const films = cartItems.filter((item) => item.itemType === 'film');
  const assets = cartItems.filter((item) => item.itemType === 'asset');

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.03),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-7 h-7 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Cart</h1>
          </div>
          <p className="text-muted-foreground">
            Review your selected films and assets before continuing.
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          <div className="rounded-3xl border border-border/20 bg-card/40 backdrop-blur-xl p-10 text-center shadow-xl shadow-black/10">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground">No films or assets added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">

              {films.length > 0 && (
                <section className="rounded-3xl border border-border/20 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-2 mb-5">
                    <Film className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Films</h2>
                    <Badge variant="secondary">{films.length}</Badge>
                  </div>

                  <div className="space-y-4">
                    {films.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/20 bg-background/30 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-24 h-16 object-cover rounded-lg border border-border/20"
                          />
                          <div>
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {assets.length > 0 && (
                <section className="rounded-3xl border border-border/20 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-2 mb-5">
                    <Package className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-semibold">Assets</h2>
                    <Badge variant="secondary">{assets.length}</Badge>
                  </div>

                  <div className="space-y-4">
                    {assets.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/20 bg-background/30 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-24 h-16 object-cover rounded-lg border border-border/20"
                          />
                          <div>
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            <div className="rounded-3xl border border-border/20 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-black/10 h-fit">
              <h2 className="text-xl font-semibold mb-5">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Films</span>
                  <span>{films.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assets</span>
                  <span>{assets.length}</span>
                </div>
                <div className="border-t border-border/20 pt-3 flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={cartItems.length === 0}
                  onClick={() => {
                    localStorage.setItem("cart", JSON.stringify(cartItems));
                    navigate("/checkout");
                  }}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>

                {cartItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add items to enable checkout
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}