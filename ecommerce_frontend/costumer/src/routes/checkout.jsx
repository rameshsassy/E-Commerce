import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { useCart } from "@/contexts/CartContext";
import { customerApi, couponApi, productApi, rewardsApi } from "@/lib/services";
import { AddressCard } from "@/components/customer/AddressCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { MapPin, CreditCard, ShoppingBag, Tag, Check, Gift } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <CheckoutPage />
    </ProtectedRoute>
  ),
});

function CheckoutPage() {
  const { items, subtotal, refresh: refreshCart } = useCart();
  const navigate = useNavigate();
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: () => customerApi.listAddresses(),
  });

  const [selectedAddr, setSelectedAddr] = useState(null);
  const [payment, setPayment] = useState("razorpay");
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [voucher, setVoucher] = useState("");
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [rewardVoucher, setRewardVoucher] = useState(null); // selected wallet voucher
  const [rewardDiscount, setRewardDiscount] = useState(0);
  const [busy, setBusy] = useState(false);

  const walletQ = useQuery({
    queryKey: ["rewards-wallet-checkout"],
    queryFn: () => rewardsApi.getWallet(),
  });
  const activeVouchers = (walletQ.data?.wallet || []).filter(w => w.status === "active" && new Date(w.expiryDate) > new Date());

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          action={
            <Button asChild>
              <Link to="/products">Shop now</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const addressList = addresses.data || [];
  const activeAddrId =
    selectedAddr ||
    addressList.find((a) => a.isDefault)?._id ||
    addressList[0]?._id;
  const activeAddr = addressList.find((a) => a._id === activeAddrId);

  const couponDiscount = couponInfo?.discount || 0;
  const voucherDiscount = voucherInfo?.discountAmount || 0;
  const total = Math.max(0, subtotal - couponDiscount - voucherDiscount - rewardDiscount);

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const r = await couponApi.apply(coupon, subtotal);
      setCouponInfo({
        discount: r.discount,
        finalAmount: r.finalAmount,
        code: coupon,
      });
      toast.success(`Coupon applied — you save ₹${r.discount}`);
    } catch (e) {
      toast.error(e.message || "Invalid coupon");
      setCouponInfo(null);
    }
  };

  const applyVoucher = async () => {
    if (!voucher) return;
    try {
      const r = await customerApi.applyVoucher(voucher);
      setVoucherInfo(r);
      toast.success(`Voucher applied — saves ₹${r.discountAmount}`);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Invalid voucher");
      setVoucherInfo(null);
    }
  };

  const checkServiceability = async () => {
    if (!activeAddr) return false;
    for (const it of items) {
      const pid = typeof it.product === "object" ? it.product._id : it.product;
      try {
        const r = await productApi.checkPincode(pid, activeAddr.pincode);
        if (!r.deliverable) {
          toast.error(`A product is not deliverable to ${activeAddr.pincode}`);
          return false;
        }
      } catch {
        /* ignore */
      }
    }
    return true;
  };

  const placeOrder = async () => {
    if (!activeAddr) return toast.error("Select an address");
    setBusy(true);
    try {
      const ok = await checkServiceability();
      if (!ok) {
        setBusy(false);
        return;
      }
      const payload = {
        addressId: activeAddr._id,
        couponCode: couponInfo?.code,
        voucherCode: voucherInfo?.voucherCode || null,
        rewardVoucherCode: rewardVoucher?.voucherCode || null,
        rewardDiscountAmount: rewardDiscount || 0,
      };

      if (payment === "cod") {
        const order = await customerApi.createCodOrder(payload);
        await refreshCart();
        toast.success("Order placed");
        navigate({ to: "/orders/$id", params: { id: order._id } });
        return;
      }

      const rzp = await customerApi.createRazorpayOrder(payload);
      if (rzp.isFree) {
        await refreshCart();
        toast.success("Order placed successfully. No Payment Required.");
        navigate({ to: "/orders/$id", params: { id: rzp.order._id } });
        return;
      }
      const keyId =
        import.meta.env.VITE_RAZORPAY_KEY || rzp.keyId || rzp.key_id;
      if (!keyId) {
        toast.error("Razorpay key not configured (VITE_RAZORPAY_KEY)");
        setBusy(false);
        return;
      }
      const w = window;
      if (!w.Razorpay) {
        toast.error("Razorpay script not loaded");
        setBusy(false);
        return;
      }
      const rz = new w.Razorpay({
        key: keyId,
        order_id: rzp.id || rzp.orderId,
        amount: rzp.amount,
        currency: rzp.currency || "INR",
        name: "Aashansh",
        description: "Order payment",
        handler: async (resp) => {
          try {
            const verified = await customerApi.verifyRazorpay({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            await refreshCart();
            toast.success("Payment successful");
            navigate({ to: "/orders/$id", params: { id: verified._id } });
          } catch (e) {
            toast.error(e.message);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: "#c84a2a" },
      });
      rz.open();
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-4 w-4" /> Delivery address
            </h2>
            {addresses.isLoading ? (
              <LoadingSpinner />
            ) : addressList.length === 0 ? (
              <EmptyState
                title="No saved addresses"
                action={
                  <Button asChild>
                    <Link to="/addresses">Add address</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addressList.map((a) => (
                  <AddressCard
                    key={a._id}
                    address={a}
                    selected={a._id === activeAddrId}
                    onSelect={() => setSelectedAddr(a._id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-4 w-4" /> Payment method
            </h2>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${payment === "razorpay" ? "border-primary bg-primary/5" : ""}`}
              >
                <RadioGroupItem value="razorpay" className="mt-1" />
                <div>
                  <div className="font-medium">Online (Razorpay)</div>
                  <p className="text-xs text-muted-foreground">
                    UPI, cards, netbanking, wallets
                  </p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${payment === "cod" ? "border-primary bg-primary/5" : ""}`}
              >
                <RadioGroupItem value="cod" className="mt-1" />
                <div>
                  <div className="font-medium">Cash on Delivery</div>
                  <p className="text-xs text-muted-foreground">
                    Pay when you receive
                  </p>
                </div>
              </label>
            </RadioGroup>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal ({items.length})</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Coupon ({couponInfo.code})</span>
                <span>−₹{couponDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher ({voucherInfo.voucherCode})</span>
                <span>−₹{voucherDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {rewardDiscount > 0 && (
              <div className="flex justify-between" style={{ color: "#6366f1" }}>
                <span>🎫 Reward ({rewardVoucher?.voucherCode})</span>
                <span>−₹{rewardDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="my-2 border-t" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Detailed Voucher Applied Info Block */}
          {voucherInfo && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl space-y-1.5 text-xs text-emerald-300">
              <div className="font-bold text-sm mb-1 text-emerald-400">Voucher Details</div>
              <div className="flex justify-between">
                <span>Cart Total:</span>
                <span className="font-medium">₹{voucherInfo.originalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Voucher:</span>
                <span className="font-mono font-bold text-emerald-400">{voucherInfo.voucherCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Eligible Amount:</span>
                <span className="font-medium">₹{voucherInfo.eligibleAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Amount:</span>
                <span className="font-bold text-emerald-400">−₹{voucherInfo.discountAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="my-1 border-t border-emerald-500/20" />
              <div className="flex justify-between font-bold text-sm">
                <span>Final Amount To Pay:</span>
                <span>₹{voucherInfo.finalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs">
              <Tag className="h-3 w-3" /> Coupon code
            </Label>
            {couponInfo ? (
              <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-2">
                <span className="text-sm font-medium text-success">
                  <Check className="mr-1 inline h-3 w-3" />
                  {couponInfo.code} applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCouponInfo(null);
                    setCoupon("");
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="ENTER CODE"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                />
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs">
              <Tag className="h-3 w-3" /> Voucher code
            </Label>
            {voucherInfo ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                <span className="text-sm font-medium text-emerald-600">
                  <Check className="mr-1 inline h-3 w-3 text-emerald-600" />
                  {voucherInfo.voucherCode} applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVoucherInfo(null);
                    setVoucher("");
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="ENTER VOUCHER"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                />
                <Button variant="outline" onClick={applyVoucher}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Reward Vouchers */}
          {activeVouchers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <Gift className="h-3 w-3" /> Apply Reward Voucher
              </Label>
              {rewardVoucher ? (
                <div className="flex items-center justify-between rounded-lg border p-2" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}>
                  <span className="text-sm font-medium" style={{ color: "#818cf8" }}>
                    <Check className="mr-1 inline h-3 w-3" />
                    {rewardVoucher.voucherCode} — saves ₹{rewardDiscount.toLocaleString("en-IN")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setRewardVoucher(null); setRewardDiscount(0); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeVouchers.map(v => (
                    <button key={v._id} onClick={() => { setRewardVoucher(v); setRewardDiscount(Math.min(v.rewardValue, total)); }}
                      className="w-full flex items-center justify-between rounded-lg border p-2.5 text-left hover:bg-muted/20 transition-colors"
                      style={{ borderColor: "rgba(99,102,241,0.2)" }}>
                      <div>
                        <code className="text-xs font-mono font-bold" style={{ color: "#818cf8" }}>{v.voucherCode}</code>
                        <div className="text-xs text-muted-foreground">{v.campaign?.campaignName} · Exp. {new Date(v.expiryDate).toLocaleDateString("en-IN")}</div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#22c55e" }}>₹{v.rewardValue}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={busy || !activeAddr}
            onClick={placeOrder}
          >
            {busy ? (
              <LoadingSpinner />
            ) : (
              `Place order • ₹${total.toLocaleString("en-IN")}`
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}
