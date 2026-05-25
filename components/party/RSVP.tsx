"use client";

import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { updateRSVPAction } from "@/app/actions"; // We need to add this to actions.ts
import { useToast } from "@/components/ui/use-toast";
import { RSVP as RSVPType } from "@/lib/db";

interface RSVPProps {
  currentStatus?: RSVPType['status'];
  currentNote?: string;
  onUpdate?: () => void;
}

export function RSVPComponent({ currentStatus, currentNote, onUpdate }: RSVPProps) {
  const params = useParams();
  const roomCode = (params?.roomCode as string) || '';
  const [status, setStatus] = useState<RSVPType['status']>(currentStatus || 'pending');
  const [note, setNote] = useState(currentNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (status === 'pending') return;
    setIsSaving(true);
    await updateRSVPAction(roomCode, status as 'coming' | 'maybe' | 'no', note);
    setIsSaving(false);
    toast({
        title: "RSVP Received",
        description: "Mo acknowledges your response.",
        variant: "default"
    });
    onUpdate?.();
  };

  return (
    <GlassCard variant="dark" className="p-6">
      <h3 className="text-xl font-playfair font-bold mb-4 flex items-center gap-2">
        Official RSVP
        <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/5">
            Required
        </span>
      </h3>

      <div className="flex gap-2 mb-4">
        {[
            { id: 'coming', label: 'In', icon: Check, color: 'bg-green-500' },
            { id: 'maybe', label: 'Maybe', icon: HelpCircle, color: 'bg-yellow-500' },
            { id: 'no', label: 'Out', icon: X, color: 'bg-red-500' }
        ].map((opt) => (
            <button 
                key={opt.id}
                onClick={() => setStatus(opt.id as RSVPType['status'])}
                className={cn(
                    "flex-1 h-12 rounded-lg flex items-center justify-center gap-2 font-bold transition-all",
                    status === opt.id 
                        ? `${opt.color} text-white shadow-lg scale-105` 
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
            >
                <opt.icon size={16} />
                {opt.label}
            </button>
        ))}
      </div>
      
      <div className="space-y-3">
        <Input 
            placeholder="Add a note (e.g. 'Bringing chips')" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-black/20"
        />
        <Button 
            onClick={handleSave} 
            disabled={isSaving || status === 'pending'}
            className="w-full bg-white/10 hover:bg-white/20"
        >
            {isSaving ? "Confirming..." : "Confirm Attendance"}
        </Button>
      </div>
    </GlassCard>
  );
}
