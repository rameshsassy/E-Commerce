import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { customerApi } from "@/lib/services";
import { LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Gift,
  Copy,
  Check,
  Award,
  ArrowRight,
  MessageSquare,
  Share2,
  Mail,
  Send,
  X,
  Star,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/refer-and-earn")({
  head: () => ({ meta: [{ title: "Refer and Earn — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <ReferAndEarnPage />
    </ProtectedRoute>
  ),
});

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function statusLabel(status) {
  if (status === "approved") return "Approved";
  return "Pending";
}

function statusClass(status) {
  if (status === "approved") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  return "bg-muted/30 text-muted-foreground border border-border/50";
}

function ReferAndEarnPage() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const inviteFormRef = useRef(null);

  const [inviteForm, setInviteForm] = useState({
    inviteeFirstName: "",
    inviteeLastName: "",
    inviteeEmail: "",
    inviteeContact: "",
  });

  const { data: resData, isLoading, error } = useQuery({
    queryKey: ["referral-details"],
    queryFn: () => customerApi.getReferralDetails(),
  });

  const data = resData || {};
  const {
    program = {},
    referralCode = "",
    referralLink = "",
    senderName = "",
    stats = {},
  } = data;

  const shareTemplate = program.shareTemplate || "Hey! Shop with me on Aashansh - discover amazing products, fast delivery, and earn rewards. Register using my link: {{Link}} or use my code {{CODE}} to get special welcome rewards. Let's shop together!";
  
  const getWorkingReferralLink = () => {
    if (!referralLink) return "";
    if (typeof window === "undefined" || !window.location.hostname.includes("localhost")) {
      return referralLink;
    }
    try {
      const url = new URL(referralLink);
      const localUrl = new URL(window.location.origin);
      url.protocol = localUrl.protocol;
      url.host = localUrl.host;
      return url.toString();
    } catch {
      return referralLink;
    }
  };

  const activeReferralLink = getWorkingReferralLink();
  const shareMessage = shareTemplate
    .replace("{{Link}}", activeReferralLink)
    .replace("{{CODE}}", referralCode || "");

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
      toast.success(`${label === "code" ? "Referral code" : "Referral link"} copied to clipboard!`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const inviteMutation = useMutation({
    mutationFn: (formData) => customerApi.sendReferralInvite(formData),
    onSuccess: (res) => {
      toast.success(res?.message || "Invitation email sent successfully!");
      setInviteForm({
        inviteeFirstName: "",
        inviteeLastName: "",
        inviteeEmail: "",
        inviteeContact: "",
      });
      setShowInviteForm(false);
      qc.invalidateQueries({ queryKey: ["referral-details"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invitation");
    },
  });

  const handleInviteChange = (field, value) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  };

  const openInviteForm = () => {
    setShowInviteForm(true);
    setTimeout(() => {
      inviteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    const { inviteeFirstName, inviteeEmail } = inviteForm;

    if (!inviteeFirstName || !inviteeEmail) {
      toast.error("Please fill in all required fields (First Name and Email)");
      return;
    }

    if (inviteeEmail.includes(" ") || /\s/.test(inviteeEmail)) {
      toast.error("Please enter a valid email without spaces");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(inviteeEmail)) {
      toast.error("Please enter a valid email format");
      return;
    }

    inviteMutation.mutate(inviteForm);
  };

  const shareOptions = useMemo(() => [
    {
      name: "WhatsApp",
      icon: <MessageSquare size={18} />,
      color: "bg-[#25D366] hover:bg-[#128C7E] text-white",
      link: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: "X (Twitter)",
      icon: <Share2 size={18} />,
      color: "bg-[#1DA1F2] hover:bg-[#0c85d0] text-white",
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: "LinkedIn",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      color: "bg-[#0077B5] hover:bg-[#005582] text-white",
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeReferralLink)}`,
    },
    {
      name: "Email",
      icon: <Mail size={18} />,
      color: "bg-slate-700 hover:bg-slate-900 text-white",
      action: openInviteForm,
    },
  ], [shareMessage, activeReferralLink]);

  if (isLoading) {
    return (
      <div className="container-page py-12 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-12 text-center text-destructive">
        <p>{error.message || "Failed to load Referral details."}</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Invites", value: stats.totalInvites ?? 0, icon: <Users className="h-5 w-5 text-indigo-400" /> },
    { label: "Approved Signups", value: stats.totalApproved ?? 0, icon: <Check className="h-5 w-5 text-emerald-400" /> },
    { label: "Referred Orders", value: stats.totalOrdersCount ?? 0, icon: <ShoppingBag className="h-5 w-5 text-pink-400" /> },
    { label: "Referred Order Spend", value: formatCurrency(stats.totalOrderSpend ?? 0), icon: <TrendingUp className="h-5 w-5 text-blue-400" /> },
  ];

  return (
    <div className="container-page py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-2">
          <Gift size={14} className="animate-bounce" />
          Refer & Earn
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Spread the Joy, <span className="text-[#ffd401]">Earn Rewards!</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          {program.subtitle || "Invite friends to Aashansh and earn reward credits when they sign up and place orders."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Referral Info */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 relative overflow-hidden border-indigo-500/10">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Your Referral Hub</h2>
                <p className="text-xs text-muted-foreground">
                  Copy your unique code or link to start inviting your friends.
                </p>
              </div>

              {/* Code Box */}
              <div className="p-5 rounded-2xl bg-muted/40 border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Your Referral Code
                  </span>
                  <span className="text-2xl font-black text-indigo-500 tracking-wider">
                    {referralCode}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-10 bg-border" />
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Shareable link
                  </span>
                  <span className="text-xs font-mono truncate block text-muted-foreground">
                    {activeReferralLink}
                  </span>
                </div>
              </div>

              {/* Link Input & Copy */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Invite Link</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border bg-muted/20 flex items-center text-xs font-mono overflow-x-auto">
                    <span className="truncate">{activeReferralLink}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => copyText("link", activeReferralLink)}
                    className="h-10 px-5 bg-[#ffd401] hover:bg-[#e6bf00] text-[#0f172a] font-bold flex items-center justify-center gap-2 border-none shrink-0"
                  >
                    {copied === "link" ? <Check size={14} /> : <Copy size={14} />}
                    {copied === "link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              {/* Social Share options */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Quick Share
                </span>
                <div className="flex flex-wrap gap-2">
                  {shareOptions.map((opt) => {
                    const isEmail = opt.name === "Email";
                    return isEmail ? (
                      <Button
                        key={opt.name}
                        type="button"
                        onClick={opt.action}
                        className={`h-9 px-4 rounded-full font-semibold text-xs flex items-center gap-1.5 border-none transition-transform hover:scale-105 ${opt.color}`}
                      >
                        {opt.icon}
                        {opt.name}
                      </Button>
                    ) : (
                      <Button
                        key={opt.name}
                        asChild
                        className={`h-9 px-4 rounded-full font-semibold text-xs flex items-center gap-1.5 border-none transition-transform hover:scale-105 ${opt.color}`}
                      >
                        <a href={opt.link} target="_blank" rel="noopener noreferrer">
                          {opt.icon}
                          {opt.name}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Referred Customers list */}
          {(stats.referredCustomers?.length ?? 0) > 0 && (
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-1.5">
                <Users className="h-5 w-5 text-indigo-400" />
                Your Referrals
              </h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs font-bold text-muted-foreground uppercase">
                      <th className="text-left px-4 py-3">Friend</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.referredCustomers.map((cust, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-semibold">{cust.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusClass(cust.status)}`}>
                            {statusLabel(cust.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {cust.joinedAt
                            ? new Date(cust.joinedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Stats and Payouts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Earnings Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award size={20} className="text-amber-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Customer Rewards
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider block">
                  Total Earnings
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight block mt-0.5">
                  {formatCurrency(stats.creditsEarned)}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold text-indigo-100">
                <span>Earn rate: ₹500 / referral</span>
                <span>Instant Credit</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <Card className="p-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 text-center text-indigo-500">
              Referral Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-muted/30 border rounded-2xl p-4 text-center flex flex-col items-center justify-center transition-all hover:bg-muted/50"
                >
                  <div className="mb-2">{card.icon}</div>
                  <span className="text-xs text-muted-foreground font-medium mb-1">
                    {card.label}
                  </span>
                  <span className="text-xl font-bold tracking-tight">
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Invite form modal/section */}
      {showInviteForm && (
        <Card ref={inviteFormRef} className="p-6 border-amber-500/20 max-w-xl mx-auto scroll-mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-1.5">
              <Mail className="h-5 w-5 text-[#ffd401]" />
              Invite Friends by Email
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInviteForm(false)}
              className="rounded-full"
            >
              <X size={16} />
            </Button>
          </div>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input
                  required
                  value={inviteForm.inviteeFirstName}
                  onChange={(e) => handleInviteChange("inviteeFirstName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  value={inviteForm.inviteeLastName}
                  onChange={(e) => handleInviteChange("inviteeLastName", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                required
                value={inviteForm.inviteeEmail}
                onChange={(e) => handleInviteChange("inviteeEmail", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile / Contact Number</Label>
              <Input
                type="tel"
                value={inviteForm.inviteeContact}
                onChange={(e) => handleInviteChange("inviteeContact", e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="w-full bg-[#ffd401] hover:bg-[#e6bf00] text-[#0f172a] font-bold border-none"
            >
              {inviteMutation.isPending ? <LoadingSpinner /> : (
                <span className="flex items-center gap-1.5">
                  <Send size={14} /> Send Invite
                </span>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* How it works */}
      <Card className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-center mb-8 flex items-center justify-center gap-1.5">
          <Star className="text-[#ffd401] h-5 w-5 animate-pulse" />
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(program.steps || []).map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center text-base font-extrabold ${
                  i === 2
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
                    : "bg-indigo-500/10 text-indigo-500"
                }`}
              >
                {i + 1}
              </div>
              <h3 className="font-bold text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-6">
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
          {program.rewardsTitle || "Referral Rewards Terms"}
        </h3>
        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-2">
          {(program.rewards || []).map((rule, idx) => (
            <li key={idx} className="leading-relaxed">{rule}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
