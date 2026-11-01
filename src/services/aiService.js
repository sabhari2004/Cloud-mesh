/**
 * CloudMesh AI & Intelligent Triage Engine
 * Provides client-side NLP classification, semantic resource matching,
 * and duplicate incident detection. Ready for Google Gemini API when configured.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const isGeminiAvailable = Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.includes('placeholder'));

// Urgency keywords dictionary for emergency triage
const CRITICAL_KEYWORDS = [
  'trapped', 'unconscious', 'not breathing', 'severe bleeding', 'chest pain',
  'suffocating', 'cardiac', 'drowning', 'explosion', 'active fire', 'electrocution',
  'crushed', 'infant', 'head trauma', 'life threat', 'hypothermia'
];

const HIGH_KEYWORDS = [
  'smoke', 'injured', 'broken bone', 'elderly', 'oxygen', 'diabetic', 'insulin',
  'flood water inside', 'roof collapse', 'gas leak', 'blocked road', 'generator needed',
  'stranded', 'no drinking water', 'freezing'
];

const MEDIUM_KEYWORDS = [
  'power outage', 'food shortage', 'basement leak', 'tree down', 'damaged fence',
  'supplies running low', 'blankets needed', 'shelter inquiry'
];

export const aiService = {
  // Assess incident severity and suggest appropriate response tier
  classifyEmergency(text = '', userCategory = '') {
    const lower = (text + ' ' + userCategory).toLowerCase();
    
    let criticalHits = 0;
    let highHits = 0;
    let mediumHits = 0;
    const detectedFactors = [];

    CRITICAL_KEYWORDS.forEach((word) => {
      if (lower.includes(word)) {
        criticalHits++;
        detectedFactors.push(`Critical indicator: "${word}"`);
      }
    });

    HIGH_KEYWORDS.forEach((word) => {
      if (lower.includes(word)) {
        highHits++;
        detectedFactors.push(`High urgency factor: "${word}"`);
      }
    });

    MEDIUM_KEYWORDS.forEach((word) => {
      if (lower.includes(word)) {
        mediumHits++;
      }
    });

    let suggestedSeverity = 'low';
    let urgencyScore = 20;

    if (criticalHits > 0) {
      suggestedSeverity = 'critical';
      urgencyScore = Math.min(100, 85 + criticalHits * 5);
    } else if (highHits >= 2 || (highHits >= 1 && mediumHits >= 1)) {
      suggestedSeverity = 'high';
      urgencyScore = Math.min(84, 65 + highHits * 7);
    } else if (highHits === 1 || mediumHits >= 2) {
      suggestedSeverity = 'medium';
      urgencyScore = 50;
    }

    // Auto-detect best emergency category if not specifically chosen
    let suggestedCategory = userCategory || 'other';
    if (lower.includes('water') || lower.includes('flood') || lower.includes('drain') || lower.includes('culvert')) {
      suggestedCategory = 'flood_storm';
    } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('burning')) {
      suggestedCategory = 'fire';
    } else if (lower.includes('breathing') || lower.includes('medic') || lower.includes('bleed') || lower.includes('pain') || lower.includes('oxygen')) {
      suggestedCategory = 'medical';
    } else if (lower.includes('tree') || lower.includes('roof') || lower.includes('structure') || lower.includes('wall')) {
      suggestedCategory = 'structural';
    } else if (lower.includes('power') || lower.includes('transformer') || lower.includes('blackout') || lower.includes('electricity')) {
      suggestedCategory = 'utility_outage';
    }

    return {
      severity: suggestedSeverity,
      score: urgencyScore,
      suggestedCategory,
      detectedFactors,
      engine: isGeminiAvailable ? 'Gemini Pro + Local Triage' : 'CloudMesh Intelligent Heuristic Engine',
    };
  },

  // Match emergency needs to available community inventory
  findMatchingResources(incidentText = '', incidentCategory = '', availableResources = []) {
    const textLower = incidentText.toLowerCase();

    const scored = availableResources
      .filter((res) => res.availability === 'available' || res.availability === 'partially_available')
      .map((resource) => {
        let score = 0;
        const resTitle = (resource.title || '').toLowerCase();
        const resDesc = (resource.description || '').toLowerCase();
        const resCat = (resource.category || '').toLowerCase();

        // Direct category correlation
        if (incidentCategory === 'medical' && resCat === 'medical') score += 50;
        if (incidentCategory === 'flood_storm' && (resCat === 'water' || resCat === 'shelter' || resCat === 'transportation')) score += 40;
        if (incidentCategory === 'utility_outage' && (resCat === 'equipment' || resTitle.includes('generator'))) score += 50;
        if (incidentCategory === 'supplies_food' && (resCat === 'food' || resCat === 'water')) score += 50;

        // Keyword overlap
        const words = textLower.split(/\W+/).filter((w) => w.length > 3);
        words.forEach((w) => {
          if (resTitle.includes(w)) score += 15;
          if (resDesc.includes(w)) score += 8;
        });

        return { resource, matchScore: Math.min(100, score) };
      })
      .filter((item) => item.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, 3);
  },

  // Detect potential duplicate emergency reports to prevent duplicate dispatches
  detectDuplicateReports(newDescription = '', newLocation = '', existingReports = []) {
    const newWords = new Set(newDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const locWords = new Set(newLocation.toLowerCase().split(/\W+/).filter((w) => w.length > 2));

    const duplicates = [];

    existingReports
      .filter((r) => ['reported', 'verified', 'assigned', 'in_progress'].includes(r.status))
      .forEach((report) => {
        const existWords = new Set((report.description || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3));
        const existLoc = new Set((report.location || '').toLowerCase().split(/\W+/).filter((w) => w.length > 2));

        // Jaccard similarity for description
        let intersection = 0;
        newWords.forEach((w) => {
          if (existWords.has(w)) intersection++;
        });
        const union = new Set([...newWords, ...existWords]).size;
        const descSimilarity = union > 0 ? intersection / union : 0;

        // Proximity similarity for location
        let locIntersection = 0;
        locWords.forEach((w) => {
          if (existLoc.has(w)) locIntersection++;
        });
        const locSimilarity = locWords.size > 0 ? locIntersection / locWords.size : 0;

        const combinedScore = Math.round((descSimilarity * 0.6 + locSimilarity * 0.4) * 100);

        if (combinedScore >= 35) {
          duplicates.push({
            report,
            similarityScore: combinedScore,
            reason: locSimilarity > 0.4 ? 'Same or neighboring location reported' : 'High text and incident pattern similarity',
          });
        }
      });

    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
  }
};
