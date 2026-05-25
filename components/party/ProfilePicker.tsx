import { User } from "@/lib/db";
import { HyperCard } from "@/components/ui/HyperCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfilePickerProps {
  users: User[];
  onSelect: (user: User) => void;
  selectedId?: string;
}

export function ProfilePicker({ users, onSelect, selectedId }: ProfilePickerProps) {
  // Map hardcoded IDs to neon variants
  const getVariant = (id: string) => {
    switch(id) {
        case "mo": return "neon-santa";
        case "yazan": return "neon-elf";
        case "mustafa": return "neon-blue";
        case "omar": return "neon-gold";
        default: return "glass";
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mx-auto perspective-500">
      {users.map((user, index) => {
        const isSelected = selectedId === user.id;
        const variant = getVariant(user.id);
        
        return (
          <HyperCard
            key={user.id}
            onClick={() => onSelect(user)}
            variant={variant}
            className={cn(
              "cursor-pointer flex flex-col items-center justify-center p-8 transition-all duration-300 h-48",
              isSelected ? "ring-2 ring-white scale-105 z-20" : "opacity-80 hover:opacity-100"
            )}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              transition={{ delay: index * 0.1 }}
              className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            >
              {user.avatar}
            </motion.div>
            
            <h3 className={cn(
                "font-bold text-xl font-display tracking-wider uppercase text-white drop-shadow-md",
            )}>
                {user.name}
            </h3>
          </HyperCard>
        );
      })}
    </div>
  );
}
