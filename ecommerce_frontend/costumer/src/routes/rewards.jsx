import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { rewardsApi } from "@/lib/services";
import { LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "My Rewards — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <RewardsPage />
    </ProtectedRoute>
  ),
});

// ─── TABS ───
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "wallet", label: "My Wallet" },
  { id: "history", label: "Reward History" },
];

// ─── STATUS BADGE ───
function Badge({ status }) {
  const styles = {
    active: "bg-emerald-500/15 text-emerald-400",
    redeemed: "bg-indigo-500/15 text-indigo-400",
    expired: "bg-red-500/15 text-red-400",
    blocked: "bg-red-500/15 text-red-400",
    credit: "bg-emerald-500/15 text-emerald-400",
    debit: "bg-red-500/15 text-red-400",
    manual_credit: "bg-indigo-500/15 text-indigo-400",
    manual_debit: "bg-amber-500/15 text-amber-400",
  };
  const labels = {
    active: "Active",
    redeemed: "Redeemed",
    expired: "Expired",
    blocked: "Blocked",
    credit: "Earned",
    debit: "Redeemed",
    manual_credit: "Added",
    manual_debit: "Deducted",
  };
  return (
    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${styles[status] || "bg-muted/30 text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── REWARD BALANCE CARD ───
function BalanceCard({ summary }) {
  const campaign = summary?.activeCampaigns?.[0];
  const primaryColor = campaign?.branding?.primaryColor || "#6366f1";
  const secondaryColor = campaign?.branding?.secondaryColor || "#8b5cf6";
  const bannerColor = campaign?.branding?.bannerColor || "#1e1b4b";

  return (
    <div
      className="rounded-3xl p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${bannerColor} 0%, #0f0c29 100%)`,
        border: `1px solid ${primaryColor}40`,
      }}
    >
      {/* Glow effects */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `${primaryColor}20`, filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `${secondaryColor}15`, filter: "blur(30px)" }} />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">🏆</div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {campaign?.campaignName || "Aashansh Rewards"}
            </h2>
            <p className="text-sm" style={{ color: `${primaryColor}cc` }}>
              {campaign?.campaignDescription || "Earn rewards on every purchase"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Available Balance", value: `₹${(summary?.availableBalance || 0).toFixed(2)}`, color: primaryColor, big: true },
            { label: "Total Earned", value: `₹${(summary?.totalEarned || 0).toFixed(2)}`, color: "#22c55e" },
            { label: "Total Redeemed", value: `₹${(summary?.totalRedeemed || 0).toFixed(2)}`, color: secondaryColor },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-black" style={{ fontSize: stat.big ? 32 : 22, color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {summary?.activeVouchers > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: `${primaryColor}25`, color: primaryColor, border: `1px solid ${primaryColor}40` }}>
            🎫 {summary.activeVouchers} active voucher{summary.activeVouchers !== 1 ? "s" : ""} ready to use
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CAMPAIGN CARD ───
function CampaignCard({ campaign }) {
  const pc = campaign?.branding?.primaryColor || "#6366f1";
  const bc = campaign?.branding?.bannerColor || "#1e1b4b";
  const rule = campaign?.rewardRule;

  const rewardLabel = () => {
    if (!rule) return "";
    if (rule.rewardType === "percentage") return `Up to ${rule.rewardPercentage || 0}% back`;
    if (rule.rewardType === "fixed_voucher") return `₹${rule.rewardValue || 0} on ₹${rule.spendAmount || 0} spend`;
    return `${rule.rewardValue || 0} points per ₹${rule.spendAmount || 0}`;
  };

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${bc}cc, #0f0c2980)`, border: `1px solid ${pc}30` }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${pc}15` }} />
      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{campaign.campaignIcon ? <img src={campaign.campaignIcon} className="w-10 h-10 object-contain" alt="" /> : "🎁"}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate" style={{ color: pc }}>{campaign.campaignName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{campaign.campaignDescription}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: pc }}>{rewardLabel()}</span>
          <span className="text-xs text-muted-foreground">
            Ends {new Date(campaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
function RewardsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["rewards-summary"],
    queryFn: () => rewardsApi.getSummary(),
  });

  const walletQ = useQuery({
    queryKey: ["rewards-wallet"],
    queryFn: () => rewardsApi.getWallet(),
    enabled: activeTab === "wallet",
  });

  const historyQ = useQuery({
    queryKey: ["rewards-history"],
    queryFn: () => rewardsApi.getHistory(),
    enabled: activeTab === "history",
  });

  const summary = summaryQ.data;
  const wallet = walletQ.data?.wallet || [];
  const history = historyQ.data?.transactions || [];

  const campaigns = summary?.activeCampaigns || [];

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Rewards</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Earn rewards automatically on every qualifying order — view your wallet and history below.
        </p>
      </div>

      {summaryQ.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : summary?.activeCampaigns?.length === 0 && !summary?.availableBalance ? (
        <Card className="p-10 text-center">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-xl font-bold mb-2">No Active Reward Campaigns</h2>
          <p className="text-muted-foreground text-sm">
            There are currently no active reward campaigns. Check back soon!
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Balance Banner */}
          <div className="mb-6">
            <BalanceCard summary={summary} />
          </div>

          {/* Active Campaigns */}
          {campaigns.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3">Active Campaigns</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {campaigns.map(c => <CampaignCard key={c._id} campaign={c} />)}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* WALLET TAB */}
          {activeTab === "wallet" && (
            <div>
              {walletQ.isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                wallet.length === 0 ? (
                  <Card className="p-10 text-center">
                    <div className="text-4xl mb-3">🎫</div>
                    <h3 className="font-bold mb-1">No vouchers yet</h3>
                    <p className="text-sm text-muted-foreground">Complete eligible orders to earn reward vouchers.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {wallet.map(w => {
                      const pc = w.campaign?.branding?.primaryColor || "#6366f1";
                      const isActive = w.status === "active";
                      return (
                        <Card key={w._id} className={`p-5 relative overflow-hidden transition-all ${isActive ? "border-primary/30" : "opacity-60"}`}>
                          {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${pc}, ${pc}80)` }} />}
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">🎫</div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono font-bold tracking-widest" style={{ color: pc }}>{w.voucherCode}</code>
                                  <Badge status={w.status} />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {w.campaign?.campaignName} • Expires {new Date(w.expiryDate).toLocaleDateString("en-IN")}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black" style={{ color: pc }}>₹{w.rewardValue.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground capitalize">{w.rewardType?.replace("_", " ")}</div>
                            </div>
                          </div>
                          {w.status === "active" && (
                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">Apply this voucher at checkout to save ₹{w.rewardValue.toFixed(2)}</p>
                              <Button asChild size="sm">
                                <Link to="/checkout">Use at Checkout →</Link>
                              </Button>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div>
              {historyQ.isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                history.length === 0 ? (
                  <Card className="p-10 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="font-bold mb-1">No history yet</h3>
                    <p className="text-sm text-muted-foreground">Your reward transactions will appear here.</p>
                  </Card>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {["Date", "Campaign", "Seller Plan", "Order Amount", "Earned", "Redeemed", "Status"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(t => (
                          <tr key={t._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-3 font-medium">{t.campaign?.campaignName || "—"}</td>
                            <td className="px-4 py-3">
                              {t.sellerPlan ? <span className="capitalize text-xs bg-muted/30 px-2 py-0.5 rounded-full">{t.sellerPlan}</span> : "—"}
                            </td>
                            <td className="px-4 py-3">₹{(t.orderAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              {t.rewardEarned > 0 ? <span className="font-bold text-emerald-500">+₹{t.rewardEarned.toFixed(2)}</span> : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {t.rewardRedeemed > 0 ? <span className="font-bold text-red-400">-₹{t.rewardRedeemed.toFixed(2)}</span> : "—"}
                            </td>
                            <td className="px-4 py-3"><Badge status={t.type} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-bold mb-3 text-base">How Rewards Work</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {[
                    { icon: "🛒", text: "Shop from eligible products and sellers" },
                    { icon: "📦", text: "Rewards are credited when your order is Delivered" },
                    { icon: "🎫", text: "A reward voucher is added to your wallet automatically" },
                    { icon: "💳", text: "Apply vouchers at checkout to reduce your next order total" },
                    { icon: "⏰", text: "Vouchers expire — use them before the expiry date!" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {campaigns.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-bold mb-3 text-base">Current Reward Rates</h3>
                  <div className="space-y-2">
                    {campaigns.map(c => {
                      const rule = c.rewardRule;
                      if (!rule) return null;
                      return (
                        <div key={c._id} className="rounded-xl p-4" style={{ background: `${c.branding?.primaryColor || "#6366f1"}10`, border: `1px solid ${c.branding?.primaryColor || "#6366f1"}20` }}>
                          <div className="font-bold" style={{ color: c.branding?.primaryColor || "#6366f1" }}>{c.campaignName}</div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            {rule.freeSellerRewardPercentage != null && (
                              <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                                <div className="font-black text-emerald-400 text-lg">{rule.freeSellerRewardPercentage}%</div>
                                <div className="text-muted-foreground">Free Sellers</div>
                              </div>
                            )}
                            {rule.proSellerRewardPercentage != null && (
                              <div className="text-center p-2 rounded-lg bg-indigo-500/10">
                                <div className="font-black text-indigo-400 text-lg">{rule.proSellerRewardPercentage}%</div>
                                <div className="text-muted-foreground">Pro Sellers</div>
                              </div>
                            )}
                            {rule.premiumSellerRewardPercentage != null && (
                              <div className="text-center p-2 rounded-lg bg-amber-500/10">
                                <div className="font-black text-amber-400 text-lg">{rule.premiumSellerRewardPercentage}%</div>
                                <div className="text-muted-foreground">Premium Sellers</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
