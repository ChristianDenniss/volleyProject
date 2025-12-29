// Player archetype classification system with prefix/suffix combinations

export type PlayerArchetype = {
  id: string;
  name: string;
  color: string;
  description: string;
};

type PrimaryTrait = {
  id: string;
  name: string;
  condition: (features: Record<string, number>) => boolean;
};

type SecondaryTrait = {
  id: string;
  name: string;
  color: string;
  condition: (features: Record<string, number>) => boolean;
};

type StandaloneArchetype = {
  id: string;
  name: string;
  color: string;
  description: string;
  condition: (features: Record<string, number>) => boolean;
};

// Primary traits (prefixes) - describe error/consistency patterns
const PRIMARY_TRAITS: PrimaryTrait[] = [
  {
    id: "maverick",
    name: "Maverick",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      return totalErrors > 1.5 || f.spikingErrorsPerSet > 1.0 || f.settingErrorsPerSet > 0.8;
    }
  },
  {
    id: "precise",
    name: "Precise",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      return totalErrors < 0.5 && f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.2;
    }
  },
  {
    id: "workhorse",
    name: "Workhorse",
    condition: (f) => 
      (f.spikeAttemptsPerSet > 5.0 || f.apeAttemptsPerSet > 2.0 || f.assistsPerSet > 8.0)
  },
  {
    id: "selective",
    name: "Selective",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 1.5 && f.apeAttemptsPerSet < 0.5 && f.assistsPerSet < 2.0 && f.digsPerSet < 2.0)
  },
  {
    id: "steady",
    name: "Steady",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 2.0 && f.apeAttemptsPerSet < 0.5) && 
      (f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  }
];

// Secondary traits (suffixes) - describe role/play style
const SECONDARY_TRAITS: SecondaryTrait[] = [
  {
    id: "striker",
    name: "Striker",
    color: "#FF6B6B",
    condition: (f) => 
      (f.spikeKillsPerSet > 2.5 || f.apeKillsPerSet > 1.0) && 
      (f.spikeAttemptsPerSet > 4.0 || f.apeAttemptsPerSet > 1.5)
  },
  {
    id: "guardian",
    name: "Guardian",
    color: "#4ECDC4",
    condition: (f) => 
      (f.digsPerSet > 3.0 || f.blocksPerSet > 1.0)
  },
  {
    id: "playmaker",
    name: "Playmaker",
    color: "#C7CEEA",
    condition: (f) => f.assistsPerSet > 6.0
  },
  {
    id: "finisher",
    name: "Finisher",
    color: "#A8E6CF",
    condition: (f) => 
      (f.spikeKillsPerSet > 2.5 || f.apeKillsPerSet > 1.0)
  },
  {
    id: "intimidator",
    name: "Intimidator",
    color: "#FCBAD3",
    condition: (f) => 
      (f.blocksPerSet > 1.0 || f.blockFollowsPerSet > 1.5)
  },
  {
    id: "bomber",
    name: "Bomber",
    color: "#FFD3A5",
    condition: (f) => f.acesPerSet > 0.8
  },
  {
    id: "versatile",
    name: "Versatile",
    color: "#FFFFD2",
    condition: (f) => {
      const hasOffense = (f.spikeKillsPerSet > 1.5 || f.apeKillsPerSet > 0.8);
      const hasDefense = (f.digsPerSet > 2.0 || f.blocksPerSet > 0.8);
      const hasSetting = f.assistsPerSet > 3.0;
      return (hasOffense && hasDefense) || (hasOffense && hasSetting) || (hasDefense && hasSetting);
    }
  },
  {
    id: "jack-of-all-trades",
    name: "Jack of All Trades",
    color: "#D4A5FF",
    condition: (f) => {
      const allStats = [
        f.spikeKillsPerSet, f.apeKillsPerSet, f.assistsPerSet, f.digsPerSet, 
        f.blocksPerSet, f.acesPerSet
      ];
      return allStats.filter(s => s > 0.5 && s < 3.0).length >= 3;
    }
  }
];

// Standalone archetypes (unique, don't combine)
const STANDALONE_ARCHETYPES: StandaloneArchetype[] = [
  {
    id: "perfectly-balanced",
    name: "Perfectly Balanced",
    color: "#95E1D3",
    description: "Exceptionally balanced across all statistical categories",
    condition: (f) => {
      const offensive = f.spikeKillsPerSet + f.apeKillsPerSet;
      const defensive = f.digsPerSet + f.blocksPerSet;
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet;
      const setting = f.assistsPerSet;
      // Check if all categories are within a tight range (balanced)
      const stats = [offensive, defensive, setting];
      const min = Math.min(...stats);
      const max = Math.max(...stats);
      return offensive >= 1.5 && offensive <= 4.0 && 
             defensive >= 1.5 && defensive <= 4.0 && 
             setting >= 1.5 && setting <= 4.0 &&
             totalErrors < 1.0 &&
             (max - min) < 1.5; // All stats within 1.5 of each other
    }
  },
  {
    id: "unicorn",
    name: "Unicorn",
    color: "#9B59B6",
    description: "Elite performance across multiple categories simultaneously",
    condition: (f) => {
      // Must be elite in at least 3 different categories
      const eliteCategories = [
        f.spikeKillsPerSet > 3.5 || f.apeKillsPerSet > 1.5, // Elite offense
        f.assistsPerSet > 8.0, // Elite setting
        f.digsPerSet > 4.5 || f.blocksPerSet > 1.5, // Elite defense
        f.acesPerSet > 1.2, // Elite serving
        (f.spikeKillsPerSet + f.apeKillsPerSet) / Math.max(1, f.spikeAttemptsPerSet + f.apeAttemptsPerSet) > 0.6 && (f.spikeKillsPerSet + f.apeKillsPerSet) > 3.0 // Elite efficiency
      ];
      return eliteCategories.filter(Boolean).length >= 3;
    }
  },
  {
    id: "sniper",
    name: "Sniper",
    color: "#FFB74D",
    description: "Exceptional kill rate with minimal errors",
    condition: (f) => {
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      if (totalAttempts < 3.0) return false; // Need meaningful volume
      const killRate = totalKills / totalAttempts;
      return killRate > 0.55 && 
             totalKills > 2.5 &&
             (f.spikingErrorsPerSet < 0.8 && f.settingErrorsPerSet < 0.3);
    }
  },
  {
    id: "gunslinger",
    name: "Gunslinger",
    color: "#FF8C94",
    description: "High volume, high risk, high reward",
    condition: (f) => {
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet;
      return totalAttempts > 6.0 && 
             totalKills > 3.0 &&
             totalErrors > 1.2;
    }
  },
  {
    id: "anchor",
    name: "Anchor",
    color: "#C8E6C9",
    description: "Steady and reliable, low risk approach",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 2.0 && f.apeAttemptsPerSet < 0.5) && 
      (f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  }
];

/**
 * Classify a player into an archetype based on their raw per-set features.
 * Uses a prefix-suffix combination system where primary traits (error patterns)
 * combine with secondary traits (role/play style) to create descriptive labels.
 * 
 * @param features - Raw per-set statistical features for the player
 * @returns PlayerArchetype object with id, name, color, and description, or null if no match
 */
export function classifyPlayerArchetype(features: Record<string, number>): PlayerArchetype | null {
  // First check standalone archetypes (most specific)
  for (const standalone of STANDALONE_ARCHETYPES) {
    if (standalone.condition(features)) {
      return {
        id: standalone.id,
        name: standalone.name,
        color: standalone.color,
        description: standalone.description
      };
    }
  }
  
  // Find matching primary trait
  const primaryTrait = PRIMARY_TRAITS.find(trait => trait.condition(features));
  
  // Find matching secondary trait
  const secondaryTrait = SECONDARY_TRAITS.find(trait => trait.condition(features));
  
  // Special combinations: Check for dual-secondary traits first (playmaker + intimidator)
  const isPlaymaker = features.assistsPerSet > 6.0;
  const isIntimidator = (features.blocksPerSet > 1.0 || features.blockFollowsPerSet > 1.5);
  
  if (isPlaymaker && isIntimidator) {
    // Determine which is more dominant
    if (features.assistsPerSet > features.blocksPerSet * 3) {
      // Assist heavy = Playmaking Intimidator
      return {
        id: "playmaking-intimidator",
        name: "Playmaking Intimidator",
        color: "#C7CEEA",
        description: "Elite setter with commanding presence at the net"
      };
    } else {
      // Block heavy = Intimidating Playmaker
      return {
        id: "intimidating-playmaker",
        name: "Intimidating Playmaker",
        color: "#FCBAD3",
        description: "Dominant blocker who orchestrates the offense"
      };
    }
  }
  
  // If we have both primary and secondary, combine them with creative naming
  if (primaryTrait && secondaryTrait) {
    // Special combinations with unique names
    if (primaryTrait.id === "maverick" && secondaryTrait.id === "playmaker") {
      return {
        id: "maverick-playmaker",
        name: "Maverick Playmaker",
        color: secondaryTrait.color,
        description: "Bold playmaker who takes risks to create opportunities"
      };
    }
    
    // Default combination
    return {
      id: `${primaryTrait.id}-${secondaryTrait.id}`,
      name: `${primaryTrait.name} ${secondaryTrait.name}`,
      color: secondaryTrait.color,
      description: `${primaryTrait.name.toLowerCase()} ${secondaryTrait.name.toLowerCase()}`
    };
  }
  
  // If only secondary trait, use it alone
  if (secondaryTrait) {
    return {
      id: secondaryTrait.id,
      name: secondaryTrait.name,
      color: secondaryTrait.color,
      description: `Specialized ${secondaryTrait.name.toLowerCase()}`
    };
  }
  
  // If only primary trait, use it alone (less common)
  if (primaryTrait) {
    return {
      id: primaryTrait.id,
      name: primaryTrait.name,
      color: "#95a5a6",
      description: `${primaryTrait.name.toLowerCase()} player`
    };
  }
  
  return null; // No archetype matched
}

