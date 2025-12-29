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
    id: "error-prone",
    name: "Error Prone",
    condition: (f) => 
      (f.spikingErrorsPerSet > 0.5 || f.settingErrorsPerSet > 0.5 || f.servingErrorsPerSet > 0.5 || f.miscErrorsPerSet > 0.5)
  },
  {
    id: "efficient",
    name: "Efficient",
    condition: (f) => 
      (f.spikingErrorsPerSet < 0.2 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2 && f.miscErrorsPerSet < 0.2)
  },
  {
    id: "high-volume",
    name: "High Volume",
    condition: (f) => 
      (f.spikeAttemptsPerSet > 0.5 || f.apeAttemptsPerSet > 0.5)
  },
  {
    id: "low-volume",
    name: "Low Volume",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 0.2 && f.apeAttemptsPerSet < 0.2 && f.assistsPerSet < 0.2)
  },
  {
    id: "conservative",
    name: "Conservative",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 0.2 && f.apeAttemptsPerSet < 0.2) && 
      (f.spikingErrorsPerSet < 0.2 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  }
];

// Secondary traits (suffixes) - describe role/play style
const SECONDARY_TRAITS: SecondaryTrait[] = [
  {
    id: "offensive",
    name: "Offensive",
    color: "#FF6B6B",
    condition: (f) => 
      (f.spikeKillsPerSet > 0.5 || f.apeKillsPerSet > 0.5) && 
      (f.spikeAttemptsPerSet > 0.3 || f.apeAttemptsPerSet > 0.3)
  },
  {
    id: "defender",
    name: "Defender",
    color: "#4ECDC4",
    condition: (f) => 
      (f.digsPerSet > 0.5 || f.blocksPerSet > 0.5)
  },
  {
    id: "setter",
    name: "Setter",
    color: "#C7CEEA",
    condition: (f) => f.assistsPerSet > 0.5
  },
  {
    id: "scorer",
    name: "Scorer",
    color: "#A8E6CF",
    condition: (f) => 
      (f.spikeKillsPerSet > 0.5 || f.apeKillsPerSet > 0.5)
  },
  {
    id: "blocker",
    name: "Blocker",
    color: "#FCBAD3",
    condition: (f) => 
      (f.blocksPerSet > 0.5 || f.blockFollowsPerSet > 0.5)
  },
  {
    id: "server",
    name: "Server",
    color: "#FFD3A5",
    condition: (f) => f.acesPerSet > 0.5
  },
  {
    id: "balanced",
    name: "Balanced",
    color: "#95E1D3",
    condition: (f) => {
      const offensive = Math.abs(f.spikeKillsPerSet) + Math.abs(f.apeKillsPerSet);
      const defensive = Math.abs(f.digsPerSet) + Math.abs(f.blocksPerSet);
      const errors = Math.abs(f.spikingErrorsPerSet) + Math.abs(f.settingErrorsPerSet) + Math.abs(f.servingErrorsPerSet);
      return offensive < 1 && defensive < 1 && errors < 1 && f.assistsPerSet < 0.5;
    }
  },
  {
    id: "all-around",
    name: "All-Around",
    color: "#FFFFD2",
    condition: (f) => {
      const hasOffense = (f.spikeKillsPerSet > 0.3 || f.apeKillsPerSet > 0.3);
      const hasDefense = (f.digsPerSet > 0.3 || f.blocksPerSet > 0.3);
      const hasSetting = f.assistsPerSet > 0.3;
      return (hasOffense && hasDefense) || (hasOffense && hasSetting) || (hasDefense && hasSetting);
    }
  },
  {
    id: "utility",
    name: "Utility",
    color: "#D4A5FF",
    condition: (f) => {
      const allStats = [
        f.spikeKillsPerSet, f.apeKillsPerSet, f.assistsPerSet, f.digsPerSet, 
        f.blocksPerSet, f.acesPerSet
      ];
      return allStats.filter(s => Math.abs(s) > 0.2 && Math.abs(s) < 0.6).length >= 3;
    }
  }
];

// Standalone archetypes (unique, don't combine)
const STANDALONE_ARCHETYPES: StandaloneArchetype[] = [
  {
    id: "conservative",
    name: "Conservative",
    color: "#C8E6C9",
    description: "Low attempts, low errors",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 0.2 && f.apeAttemptsPerSet < 0.2) && 
      (f.spikingErrorsPerSet < 0.2 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  },
  {
    id: "high-flyer",
    name: "High Flyer",
    color: "#FFB74D",
    description: "High kills relative to attempts, low errors",
    condition: (f) => {
      const killRate = (f.spikeKillsPerSet + f.apeKillsPerSet) / Math.max(1, f.spikeAttemptsPerSet + f.apeAttemptsPerSet);
      return killRate > 0.6 && 
             (f.spikeKillsPerSet > 0.4 || f.apeKillsPerSet > 0.4) &&
             (f.spikingErrorsPerSet < 0.25 && f.settingErrorsPerSet < 0.25);
    }
  },
  {
    id: "risk-taker",
    name: "Risk Taker",
    color: "#FF8C94",
    description: "High attempts, high errors, high kills",
    condition: (f) => 
      (f.spikeAttemptsPerSet > 0.5 || f.apeAttemptsPerSet > 0.5) && 
      (f.spikeKillsPerSet > 0.4 || f.apeKillsPerSet > 0.4) &&
      (f.spikingErrorsPerSet > 0.4 || f.settingErrorsPerSet > 0.4)
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
  
  // If we have both, combine them
  if (primaryTrait && secondaryTrait) {
    return {
      id: `${primaryTrait.id}-${secondaryTrait.id}`,
      name: `${primaryTrait.name} - ${secondaryTrait.name}`,
      color: secondaryTrait.color,
      description: `${primaryTrait.name.toLowerCase()} player with ${secondaryTrait.name.toLowerCase()} focus`
    };
  }
  
  // If only secondary trait, use it alone
  if (secondaryTrait) {
    return {
      id: secondaryTrait.id,
      name: secondaryTrait.name,
      color: secondaryTrait.color,
      description: `Player with ${secondaryTrait.name.toLowerCase()} focus`
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

