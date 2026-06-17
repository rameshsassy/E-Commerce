import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { faqApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  HelpCircle,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — Aashansh" },
      {
        name: "description",
        content:
          "Find answers to frequently asked questions about orders, payments, shipping, returns, and more.",
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    userType: "Customer",
    subject: "",
    question: "",
  });

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["publicFaqs"],
    queryFn: () => faqApi.list(),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => faqApi.submitQuestion(data),
    onSuccess: () => {
      setSubmitted(true);
      setForm({ name: "", email: "", userType: "Customer", subject: "", question: "" });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to submit question");
    },
  });

  const filtered = faqs.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.question) {
      toast.error("Please fill in all fields");
      return;
    }
    submitMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="container-page relative z-10 py-16 md:py-20 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg mb-6">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            How can we help?
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-lg mx-auto mb-8">
            Search our knowledge base or browse below to find answers.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs (e.g. tracking, refunds, password)"
              className="pl-11 pr-4 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-amber-400/40 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="container-page py-12 md:py-16">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          Frequently Asked Questions
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Search className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500 mb-1">
              {search ? `No results for "${search}"` : "No FAQs available yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-amber-600 font-semibold hover:underline mt-1"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq) => {
              const isOpen = openId === faq._id;
              return (
                <div
                  key={faq._id}
                  className={`rounded-xl border transition-all duration-200 ${
                    isOpen
                      ? "border-amber-300 bg-amber-50/30 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq._id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span
                      className={`font-semibold text-sm md:text-base ${
                        isOpen ? "text-amber-800" : "text-slate-800"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 text-amber-500"
                          : "text-slate-400"
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Submit Question Form */}
      <section className="container-page pb-16 md:pb-20">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Send className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Still have a question?
              </h3>
              <p className="text-xs text-slate-500">
                Submit your question and our team will get back to you.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-800 mb-1">
                Question submitted successfully!
              </p>
              <p className="text-sm text-emerald-600">
                Our team will review it and publish an answer soon.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Ask another question
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Name *
                  </label>
                  <Input
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    I am a *
                  </label>
                  <select
                    value={form.userType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, userType: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject *
                  </label>
                  <Input
                    placeholder="Brief subject"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Question *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your question in detail..."
                  value={form.question}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, question: e.target.value }))
                  }
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="bg-[#ffd401] text-[#0f172a] hover:bg-[#e6bf00] font-bold rounded-xl px-6 h-11"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Question
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
