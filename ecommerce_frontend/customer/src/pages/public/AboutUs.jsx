import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Network,
  Bot,
  Users,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  Sparkles,
  BarChart3,
  Globe,
  Target,
  ChevronRight,
} from "lucide-react";

const sdgGoals = [
  { num: 1, name: "No Poverty", color: "#E5243B" },
  { num: 2, name: "Zero Hunger", color: "#DDA63A" },
  { num: 3, name: "Good Health and Well-being", color: "#4C9F38" },
  { num: 4, name: "Quality Education", color: "#C5192D" },
  { num: 5, name: "Gender Equality", color: "#FF3A21" },
  { num: 6, name: "Clean Water and Sanitation", color: "#26BDE2" },
  { num: 7, name: "Affordable and Clean Energy", color: "#FCC30B" },
  { num: 8, name: "Decent Work and Economic Growth", color: "#A21942" },
  { num: 9, name: "Industry, Innovation and Infrastructure", color: "#FD6925" },
  { num: 10, name: "Reduced Inequalities", color: "#DD1367" },
  { num: 11, name: "Sustainable Cities and Communities", color: "#FD9D24" },
  { num: 12, name: "Responsible Consumption and Production", color: "#BF8B2E" },
  { num: 13, name: "Climate Action", color: "#3F7E44" },
  { num: 14, name: "Life Below Water", color: "#0A97D9" },
  { num: 15, name: "Life on Land", color: "#56C029" },
  { num: 16, name: "Peace, Justice and Strong Institutions", color: "#00689D" },
  { num: 17, name: "Partnerships for the Goals", color: "#19486A" },
];

const clientLogos = Array.from({ length: 21 }, (_, i) => i + 1);

const About = () => {
  return (
    <div className="w-full font-sans">
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes about-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        .about-animate-scroll-left { animation: scroll-left 40s linear infinite; }
        .about-animate-scroll-right { animation: scroll-right 40s linear infinite; }
        .about-scroll-mask {
          -webkit-mask: linear-gradient(90deg, transparent, white 8%, white 92%, transparent);
          mask: linear-gradient(90deg, transparent, white 8%, white 92%, transparent);
        }
        .about-hero-float { animation: about-float 6s ease-in-out infinite; }
        .about-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .about-fade-in-up-delayed { opacity: 0; animation: fadeInUp 0.8s ease-out 0.3s forwards; }
        .about-ken-burns { animation: kenBurns 12s ease-in-out infinite alternate; }
      `}</style>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=2000"
            alt="Aashansh Hero"
            className="w-full h-full object-cover about-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/90 via-[#6366f1]/70 to-[#8b5cf6]/60" />
        </div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+")`,
          }}
        />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-bold mb-4 tracking-[0.2em] uppercase bg-white/15 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10 about-fade-in-up">
                <Sparkles size={12} /> Why Shop with Aashansh
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.05] about-fade-in-up-delayed">
                Empowering Communities Through Conscious Commerce
              </h1>
              <p className="text-base md:text-lg text-white/80 max-w-lg font-medium leading-relaxed about-fade-in-up-delayed">
                Aashansh is a purpose-driven e-commerce platform connecting authentic, handcrafted, and everyday products made by aspiring brands to conscious consumers across India.
              </p>
              <div className="flex flex-wrap gap-3 mt-8 about-fade-in-up-delayed">
                <Link
                  to="/register"
                  className="inline-flex h-12 px-8 rounded-full bg-white text-primary font-black text-sm items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
                >
                  Join Aashansh <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">

        {/* ═══════════ MISSION / IMPACT ═══════════ */}
        <div className="grid md:grid-cols-2 gap-8 mb-14 items-stretch">
          <div className="relative group overflow-hidden rounded-[40px] bg-surface border border-glass-border shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative p-10 md:p-12">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 text-white shadow-lg shadow-primary/20">
                <Target size={26} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-text tracking-tight mb-4">Our Mission</h2>
              <p className="text-text-muted font-medium leading-relaxed">
                To financially empower entrepreneurs and artisans by connecting them to B2C and B2B customers, amplifying business growth through authentic, inclusive, and impactful commerce.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[40px] min-h-[280px]">
            <img
              src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=800"
              alt="Impact"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-10">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/15 backdrop-blur-md text-white font-black text-xl md:text-2xl border border-white/20">
                <TrendingUp size={24} /> 500+ <span className="text-sm font-semibold text-white/70 ml-1">Sellers Empowered</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ EMPOWERING ENTREPRENEURS ═══════════ */}
        <div className="relative mb-14">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[54px] blur-xl" />
          <div className="relative bg-surface rounded-[50px] overflow-hidden shadow-xl border border-glass-border">
            <div className="grid md:grid-cols-2">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-[0.15em] mb-3">
                  <BarChart3 size={14} /> Growth
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-text tracking-tight mb-4">
                  Empowering Entrepreneurs & Artisans
                </h2>
                <p className="text-text-muted font-medium leading-relaxed mb-6">
                  Aashansh offers a seamless platform combining discovery, trust, and tools for sellers to reach customers and scale their impact across India.
                </p>
                <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-primary/10 text-primary font-black text-xl md:text-2xl w-fit">
                  <TrendingUp size={24} /> Direct Impact <span className="text-sm font-semibold text-text-muted ml-1">on Livelihoods</span>
                </div>
              </div>
              <div className="relative min-h-[300px] md:min-h-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&q=80&w=800"
                  alt="Entrepreneurs"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-surface/20" />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SDG GOALS ═══════════ */}
        <div className="relative mb-14">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-[54px] blur-xl" />
          <div className="relative bg-surface/80 backdrop-blur-xl rounded-[50px] p-10 md:p-14 border border-glass-border shadow-xl text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-[0.15em] mb-3">
                <Globe size={14} /> United Nations
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-text tracking-tight mb-2">
                Sustainable Development Goals
              </h2>
              <p className="text-sm font-semibold text-text-muted mb-8 max-w-2xl mx-auto">
                The 17 SDGs — 195 nations united to change the world for the better
              </p>
              <div className="about-scroll-mask">
                <div className="w-max flex gap-4 about-animate-scroll-left">
                  {[...sdgGoals, ...sdgGoals].map((g, idx) => (
                    <a
                      key={idx}
                      href={`https://sdgs.un.org/goals/goal${g.num}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-[150px] rounded-2xl p-4 text-white text-center flex flex-col items-center gap-2 transition-all hover:scale-105 hover:shadow-xl hover:brightness-110"
                      style={{ backgroundColor: g.color }}
                    >
                      <img
                        src={`https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(g.num).padStart(2, "0")}.jpg`}
                        alt={g.name}
                        className="w-14 h-14 rounded-xl"
                        loading="lazy"
                      />
                      <div className="text-[11px] font-bold leading-tight">{g.name}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ FEATURES ═══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: <Network size={28} />,
              gradient: "from-purple-500 to-purple-700",
              title: "Strategic Networking",
              desc: "Connect with CSR partners, investors, and a community of like-minded conscious consumers.",
              img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=400",
            },
            {
              icon: <Bot size={28} />,
              gradient: "from-blue-500 to-blue-700",
              title: "AI-Powered Discovery",
              desc: "Smart recommendations and personalized shopping journeys for every customer.",
              img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400",
            },
            {
              icon: <Users size={28} />,
              gradient: "from-primary to-secondary",
              title: "Community First",
              desc: "Every purchase supports real artisans, self-help groups, and micro-entrepreneurs.",
              img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative bg-surface rounded-[40px] border border-glass-border shadow-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div
                  className={`absolute bottom-3 left-4 h-12 w-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {item.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-text mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm font-semibold text-text-muted leading-relaxed">{item.desc}</p>
                <div className="mt-4 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                  Learn more <ChevronRight size={14} className="ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════ STATS BANNER ═══════════ */}
        <div className="relative mb-14 overflow-hidden rounded-[50px]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=2000"
              alt="Stats background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/95 via-primary/85 to-secondary/80" />
          </div>
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 p-12 md:p-16">
            {[
              { value: "500+", label: "Sellers" },
              { value: "10K+", label: "Products Listed" },
              { value: "50+", label: "CSR Partners" },
              { value: "17", label: "SDG Goals Aligned" },
            ].map((s, i) => (
              <div key={i} className="text-center text-white">
                <div className="text-4xl md:text-5xl font-black mb-1 tracking-tight">{s.value}</div>
                <div className="text-sm text-white/70 font-semibold tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ CTA ═══════════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-[54px] blur-xl opacity-50" />
          <div className="relative rounded-[50px] overflow-hidden shadow-xl">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000"
                alt="CTA background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-secondary/90" />
            </div>
            <div className="relative p-12 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-white/90 font-medium mb-8 max-w-xl mx-auto">
                Join Aashansh today and be a part of India's movement toward conscious, inclusive, and impactful commerce.
              </p>
              <Link
                to="/register"
                className="inline-flex h-14 px-10 rounded-full bg-white text-primary font-black text-base items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                Join Aashansh Free <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════ GOT QUESTIONS ═══════════ */}
        <div className="relative mb-8 overflow-hidden rounded-[50px] bg-surface border border-glass-border shadow-xl">
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-primary/10 to-transparent rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center p-10 md:p-14">
            <div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <HelpCircle size={28} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-text tracking-tight mb-3">
                Got Questions?
              </h2>
              <p className="text-base font-semibold text-text-muted mb-6 max-w-md">
                Ask us anything. Didn&apos;t find what you were looking for? Sign up to connect with us.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/faq"
                  className="h-12 px-7 rounded-full bg-primary text-white font-bold text-sm flex items-center gap-2 transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-md"
                >
                  <MessageCircle size={16} /> View FAQs
                </Link>
                <Link
                  to="/register"
                  className="h-12 px-7 rounded-full border-2 border-primary text-primary font-bold text-sm flex items-center gap-2 transition-all hover:bg-primary hover:text-white hover:scale-105 active:scale-95"
                >
                  Sign Up <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden min-h-[200px]">
              <img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=600"
                alt="Customer support"
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
