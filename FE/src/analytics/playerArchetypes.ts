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
      // More restrictive: require higher errors OR multiple error types
      return (totalErrors > 2.0) || 
             (f.spikingErrorsPerSet > 1.2 && f.settingErrorsPerSet > 0.4) || // Multiple error types
             (f.spikingErrorsPerSet > 1.5) || // Very high spiking errors
             (f.settingErrorsPerSet > 1.0); // Very high setting errors
    }
  },
  {
    id: "inconsistent",
    name: "Inconsistent",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      // Moderate errors - between Precise and Maverick, but more restrictive
      // Require at least 1.2 total errors and multiple error types OR one significant error category
      return totalErrors > 1.2 && totalErrors <= 2.0 && 
             ((f.spikingErrorsPerSet > 0.6 && f.settingErrorsPerSet > 0.3) || // Multiple error types
              (f.spikingErrorsPerSet > 0.9) || // Significant spiking errors
              (f.settingErrorsPerSet > 0.6)); // Significant setting errors
    }
  },
  {
    id: "precise",
    name: "Precise",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      // Very low errors across all categories - slightly relaxed to make it more common
      return totalErrors < 0.6 && f.spikingErrorsPerSet < 0.35 && f.settingErrorsPerSet < 0.25;
    }
  },
  {
    id: "tireless",
    name: "Tireless",
    condition: (f) => {
      // Elite volume - top tier high-volume players (very restrictive to reduce overuse)
      return (f.spikeAttemptsPerSet > 9.0 || f.apeAttemptsPerSet > 4.0 || f.assistsPerSet > 12.0);
    }
  },
  {
    id: "workhorse",
    name: "Workhorse",
    condition: (f) => {
      // High volume but not elite - exclude those who qualify for Tireless
      // Lowered threshold to make it more common
      const isTireless = (f.spikeAttemptsPerSet > 9.0 || f.apeAttemptsPerSet > 4.0 || f.assistsPerSet > 12.0);
      return !isTireless && (f.spikeAttemptsPerSet > 4.0 || f.apeAttemptsPerSet > 1.5 || f.assistsPerSet > 7.0);
    }
  },
  {
    id: "stalwart",
    name: "Stalwart",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      // High volume with low errors - reliable at high workload
      return (f.spikeAttemptsPerSet > 5.0 || f.apeAttemptsPerSet > 2.0 || f.assistsPerSet > 8.0) &&
             totalErrors < 0.8 && // Low errors despite high volume
             f.spikingErrorsPerSet < 0.5 && // Low spiking errors
             f.settingErrorsPerSet < 0.3; // Low setting errors
    }
  },
  {
    id: "opportunistic",
    name: "Opportunistic",
    condition: (f) => {
      // Low volume but high impact when they do act
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      return totalAttempts < 3.0 && totalAttempts > 0.5 && // Low but meaningful volume
             totalKills > 1.5 && // Still generates kills
             (totalKills / Math.max(1, totalAttempts)) > 0.45; // Good efficiency
    }
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
    id: "piercer",
    name: "Piercer",
    color: "#FF8787",
    condition: (f) => {
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      if (totalAttempts < 2.5) return false; // Lowered from 3.0
      const killRate = totalKills / totalAttempts;
      // Relaxed slightly: still rare but should occur sometimes
      return (f.spikeKillsPerSet > 2.5 || f.apeKillsPerSet > 1.2) && // Lowered from 3.0/1.5
             killRate > 0.52 && // Lowered from 0.55
             totalKills > 2.5; // Lowered from 3.0
    }
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
    description: "Exceptionally balanced player with consistent contributions across offense, defense, and setting, with minimal errors",
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
    description: "Rare player who achieves elite-level performance in at least three different statistical categories simultaneously",
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
    description: "Highly efficient attacker with exceptional kill rate (55%+) and minimal errors, prioritizing precision over volume",
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
    description: "Extreme high-volume attacker with exceptional kill totals and significant errors - the ultimate risk-taker",
    condition: (f) => {
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet;
      // Extremely rare: need exceptional volume AND exceptional kills AND high errors
      // This should be rarer than Unicorn - truly exceptional in all three simultaneously
      return totalAttempts > 9.0 && 
             totalKills > 5.0 &&
             totalErrors > 2.0;
    }
  },
  {
    id: "anchor",
    name: "Anchor",
    color: "#C8E6C9",
    description: "Steady, reliable player with low attempts and minimal errors, providing stability and consistency to the team",
    condition: (f) => 
      (f.spikeAttemptsPerSet < 2.0 && f.apeAttemptsPerSet < 0.5) && 
      (f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  },
  {
    id: "technician",
    name: "Technician",
    color: "#64B5F6",
    description: "Technical precision specialist who excels through flawless execution, maintaining exceptional efficiency with minimal errors across all aspects of play",
    condition: (f) => {
      const totalErrors = f.spikingErrorsPerSet + f.settingErrorsPerSet + f.servingErrorsPerSet + f.miscErrorsPerSet;
      const totalAttempts = f.spikeAttemptsPerSet + f.apeAttemptsPerSet;
      const totalKills = f.spikeKillsPerSet + f.apeKillsPerSet;
      const killRate = totalAttempts > 0 ? totalKills / totalAttempts : 0;
      
      // Technical precision: very low errors, good efficiency, meaningful volume
      return totalErrors < 0.4 && // Extremely low errors
             f.spikingErrorsPerSet < 0.25 && // Minimal spiking errors
             f.settingErrorsPerSet < 0.15 && // Minimal setting errors
             totalAttempts >= 3.0 && // Meaningful volume
             killRate > 0.50 && // Good efficiency (50%+)
             totalKills >= 2.0; // Meaningful impact
    }
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
  
  // Find matching secondary trait - prioritize based on player role and primary trait
  let secondaryTrait = SECONDARY_TRAITS.find(trait => trait.condition(features));
  
  // If player qualifies for multiple secondary traits, prioritize based on primary trait and role
  if (primaryTrait && secondaryTrait) {
    const allMatchingTraits = SECONDARY_TRAITS.filter(trait => trait.condition(features));
    
    // For Workhorse/Tireless players, prioritize based on role
    if ((primaryTrait.id === "workhorse" || primaryTrait.id === "tireless") && allMatchingTraits.length > 1) {
      const isPlaymaker = features.assistsPerSet > 6.0;
      
      // If player is a setter (high assists), prioritize Playmaker
      if (isPlaymaker) {
        const playmakerTrait = allMatchingTraits.find(t => t.id === "playmaker");
        if (playmakerTrait) {
          secondaryTrait = playmakerTrait;
        }
      } else {
        // If not a setter, prioritize offensive traits (Striker, Piercer) over defensive (Guardian)
        const offensiveTraits = allMatchingTraits.filter(t => 
          t.id === "striker" || t.id === "piercer" || t.id === "finisher"
        );
        if (offensiveTraits.length > 0) {
          // Prioritize Piercer > Striker > Finisher
          secondaryTrait = offensiveTraits.find(t => t.id === "piercer") || 
                          offensiveTraits.find(t => t.id === "striker") || 
                          offensiveTraits[0];
        }
      }
    }
  }
  
  // Special combinations: Check for dual-secondary traits first
  const isPlaymaker = features.assistsPerSet > 6.0;
  const isIntimidator = (features.blocksPerSet > 1.0 || features.blockFollowsPerSet > 1.5);
  const isStriker = (features.spikeKillsPerSet > 2.5 || features.apeKillsPerSet > 1.0) && 
                    (features.spikeAttemptsPerSet > 4.0 || features.apeAttemptsPerSet > 1.5);
  const isPiercer = (() => {
    const totalAttempts = features.spikeAttemptsPerSet + features.apeAttemptsPerSet;
    const totalKills = features.spikeKillsPerSet + features.apeKillsPerSet;
    if (totalAttempts < 3.0) return false;
    const killRate = totalKills / totalAttempts;
    return (features.spikeKillsPerSet > 3.0 || features.apeKillsPerSet > 1.5) &&
           killRate > 0.55 && totalKills > 3.0;
  })();
  
  // Playmaker + Offensive traits (combine with primary trait if present)
  if (isPlaymaker && (isStriker || isPiercer)) {
    const primaryPrefix = primaryTrait ? `${primaryTrait.name} ` : "";
    
    if (isPiercer) {
      return {
        id: primaryTrait ? `${primaryTrait.id}-playmaking-piercer` : "playmaking-piercer",
        name: `${primaryPrefix}Playmaking Piercer`,
        color: "#FF8787",
        description: primaryTrait 
          ? `${primaryTrait.name.toLowerCase()} elite setter (6+ assists/set) who also excels as an efficient offensive threat with high kills and superior kill rate (55%+), orchestrating both setting and scoring`
          : "Elite setter (6+ assists/set) who also excels as an efficient offensive threat with high kills and superior kill rate (55%+), orchestrating both setting and scoring"
      };
    } else if (isStriker) {
      return {
        id: primaryTrait ? `${primaryTrait.id}-playmaking-striker` : "playmaking-striker",
        name: `${primaryPrefix}Playmaking Striker`,
        color: "#FF6B6B",
        description: primaryTrait
          ? `${primaryTrait.name.toLowerCase()} elite setter (6+ assists/set) who also serves as a primary offensive threat with high kill and attempt rates, orchestrating both setting and attacking`
          : "Elite setter (6+ assists/set) who also serves as a primary offensive threat with high kill and attempt rates, orchestrating both setting and attacking"
      };
    }
  }
  
  // Playmaker + Intimidator
  if (isPlaymaker && isIntimidator) {
    // Determine which is more dominant
    if (features.assistsPerSet > features.blocksPerSet * 3) {
      // Assist heavy = Playmaking Intimidator
      return {
        id: "playmaking-intimidator",
        name: "Playmaking Intimidator",
        color: "#C7CEEA",
        description: "Elite setter (6+ assists/set) who also commands the net with strong blocking presence, orchestrating both offense and defense"
      };
    } else {
      // Block heavy = Intimidating Playmaker
      return {
        id: "intimidating-playmaker",
        name: "Intimidating Playmaker",
        color: "#FCBAD3",
        description: "Dominant blocker (1+ blocks/set) who also orchestrates the offense with high assist totals, controlling both sides of the game"
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
        description: "Bold setter who takes risks to create scoring opportunities, often making high-error plays in pursuit of big moments"
      };
    }
    
    // Generate descriptive explanations for combinations
    const getDescription = (primary: PrimaryTrait, secondary: SecondaryTrait): string => {
      const primaryDesc: Record<string, string> = {
        "maverick": "Takes risks and makes significant errors (2.0+ total errors or very high in specific categories) in pursuit of aggressive plays",
        "inconsistent": "Moderate error player (0.8-2.0 total errors) with variable performance",
        "precise": "Minimizes errors and maintains high consistency",
        "tireless": "Elite high-volume player who handles an exceptional share of team actions, operating at the highest activity levels",
        "workhorse": "High volume player who handles a large share of team actions",
        "stalwart": "High volume player who maintains low errors despite heavy workload, reliable at high activity levels",
        "opportunistic": "Low volume player who makes high-impact plays when they do act, prioritizing quality opportunities",
        "selective": "Low volume player who picks their moments carefully",
        "steady": "Conservative approach with low attempts and minimal errors"
      };
      
    const secondaryDesc: Record<string, string> = {
      "striker": "Primary offensive threat with high kill and attempt rates",
      "piercer": "Efficient offensive threat with high kills and superior kill rate (50%+), prioritizing precision over volume",
      "guardian": "Defensive specialist excelling in digs and blocks",
      "playmaker": "Elite setter who orchestrates the offense with high assist totals",
      "finisher": "Efficient scorer who converts attacks into kills at a high rate",
      "intimidator": "Dominant blocker who controls the net with blocks and block follows",
      "bomber": "Powerful server who generates aces and service pressure",
      "versatile": "Well-rounded player contributing in multiple areas (offense, defense, or setting)",
      "jack-of-all-trades": "Utility player with moderate contributions across multiple statistical categories"
    };
      
      return `${primaryDesc[primary.id] || primary.name.toLowerCase()}, specializing as a ${secondaryDesc[secondary.id] || secondary.name.toLowerCase()}`;
    };
    
    // Default combination
    return {
      id: `${primaryTrait.id}-${secondaryTrait.id}`,
      name: `${primaryTrait.name} ${secondaryTrait.name}`,
      color: secondaryTrait.color,
      description: getDescription(primaryTrait, secondaryTrait)
    };
  }
  
  // If only secondary trait, use it alone
  if (secondaryTrait) {
    const secondaryDesc: Record<string, string> = {
      "striker": "Primary offensive threat focused on generating kills through high-volume attacking",
      "piercer": "Efficient offensive threat with high kills and superior kill rate (50%+), prioritizing precision and accuracy over volume",
      "guardian": "Defensive specialist who excels at digs and blocks to prevent opponent scoring",
      "playmaker": "Elite setter who orchestrates the offense, creating opportunities for teammates with high assist totals",
      "finisher": "Efficient scorer who converts attacks into kills at a high rate, focusing on quality over quantity",
      "intimidator": "Dominant blocker who controls the net, generating blocks and block follows to disrupt opponent attacks",
      "bomber": "Powerful server who generates aces and creates service pressure to score points directly",
      "versatile": "Well-rounded player who contributes significantly in multiple areas, combining offense, defense, or setting",
      "jack-of-all-trades": "Utility player with moderate but consistent contributions across multiple statistical categories"
    };
    
    return {
      id: secondaryTrait.id,
      name: secondaryTrait.name,
      color: secondaryTrait.color,
      description: secondaryDesc[secondaryTrait.id] || `Specialized ${secondaryTrait.name.toLowerCase()}`
    };
  }
  
  // If only primary trait, use it alone (less common)
  if (primaryTrait) {
    const primaryDesc: Record<string, string> = {
      "maverick": "High-risk player who makes significant errors (2.0+ total errors or very high in specific categories) but takes aggressive chances",
      "inconsistent": "Moderate error player (0.8-2.0 total errors) with variable performance and reliability",
      "precise": "Low-error player who prioritizes consistency and efficiency over volume",
      "tireless": "Elite high-volume player who handles an exceptional share of team actions and touches, operating at the highest activity levels",
      "workhorse": "High-volume player who handles a large share of team actions and touches",
      "stalwart": "High-volume player who maintains low errors despite heavy workload, reliable and consistent at high activity levels",
      "opportunistic": "Low volume player who makes high-impact plays when they do act, prioritizing quality opportunities over quantity",
      "selective": "Low-volume player who picks their moments carefully, avoiding unnecessary risks",
      "steady": "Conservative player with low attempts and minimal errors, prioritizing safe, reliable play"
    };
    
    return {
      id: primaryTrait.id,
      name: primaryTrait.name,
      color: "#95a5a6",
      description: primaryDesc[primaryTrait.id] || `${primaryTrait.name.toLowerCase()} player`
    };
  }
  
  return null; // No archetype matched
}

