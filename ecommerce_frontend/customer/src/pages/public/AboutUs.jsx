import React from 'react';
import { Link } from 'react-router-dom';
import { Info, Heart, Award, Users } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Info className="text-primary shrink-0" size={28} />
        About Aashansh
      </h1>
      <p className="text-text-muted text-sm mb-8">Empowering communities and authentic craftsmanship.</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Heart size={18} className="text-secondary" /> Our Purpose
          </h2>
          <p>
            Aashansh is a purpose-driven e-commerce platform connecting you to authentic, handcrafted, and everyday products made by aspiring brands. Every purchase supports real people, real stories, and stronger communities. Shop with Aashansh and be a part of India’s movement toward conscious, inclusive, and impactful consumption.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Users size={18} className="text-primary" /> Supporting Communities
          </h2>
          <p>
            We collaborate directly with independent artisans, women self-help groups, and local micro-entrepreneurs. By bridging the gap between creators and conscious consumers, we ensure fair pricing, steady livelihoods, and direct economic growth for communities that need it most.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
            <Award size={18} className="text-warning" /> Quality & Authenticity
          </h2>
          <p>
            Each item in our catalog is handpicked for its quality, craftsmanship, and ecological footprint. We prioritize sustainable sourcing, traditional creation methods, and items that carry the heritage of their makers.
          </p>
        </section>
      </div>

      <p className="mt-8">
        <Link to="/" className="text-primary hover:underline text-sm">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
