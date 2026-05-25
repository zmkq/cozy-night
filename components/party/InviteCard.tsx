"use client";

import { GlassCard } from "./GlassCard";
import { Calendar, MapPin, Music, Shirt } from "lucide-react";

export function InviteCard() {
  return (
    <GlassCard variant="default" className="p-0 overflow-hidden max-w-2xl mx-auto w-full group">
      <div className="bg-gold-500/10 p-6 text-center border-b border-white/10">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gold-400 mb-2 uppercase tracking-tight">MO NIGHT</h2>
        <p className="text-white/60 text-sm uppercase tracking-[0.2em]">Christmas Eve Summit 2025</p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-400">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">December 24th</h3>
                    <p className="text-white/50 text-sm">8:00 PM - Late</p>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-400">
                    <MapPin size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Mo's Penthouse</h3>
                    <p className="text-white/50 text-sm">Location Redacted</p>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-400">
                    <Shirt size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Dress Code</h3>
                    <p className="text-white/50 text-sm">Cozy / Pajamas / Ugly Sweaters</p>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-400">
                    <Music size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Vibe</h3>
                    <p className="text-white/50 text-sm">Jazz, Lofi, Chaos</p>
                </div>
            </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-justify text-sm leading-relaxed text-white/70 italic border-l-2 border-gold-500/50">
            "Gentlemen, the night finally convenes. The agenda includes: aggressive snacking, a potential Mario Party lawsuit, and determining who exactly is the 'Main Character' of 2025. Attendance is mandatory. Vibes are non-negotiable."
        </div>
      </div>
    </GlassCard>
  );
}
