import { describe, it, expect } from 'vitest';
import { aiService } from '../aiService';

describe('aiService - Intelligent Emergency Triage Engine', () => {
  describe('classifyEmergency', () => {
    it('should classify life-threatening inputs as critical with high urgency score', () => {
      const input = 'Elderly woman trapped in flooded basement, unconscious and severe bleeding';
      const result = aiService.classifyEmergency(input, '');

      expect(result.severity).toBe('critical');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.detectedFactors.length).toBeGreaterThan(0);
      expect(result.suggestedCategory).toBe('flood_storm');
    });

    it('should classify high urgency hazards with appropriate severity', () => {
      const input = 'Dense smoke inside apartment building, injured resident with broken bone';
      const result = aiService.classifyEmergency(input, '');

      expect(result.severity).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(65);
      expect(result.suggestedCategory).toBe('fire');
    });

    it('should auto-detect category correctly based on keywords', () => {
      const medicalCase = aiService.classifyEmergency('Patient has severe chest pain and cannot breathe');
      expect(medicalCase.suggestedCategory).toBe('medical');

      const blackoutCase = aiService.classifyEmergency('Transformer explosion caused entire neighborhood blackout');
      expect(blackoutCase.suggestedCategory).toBe('utility_outage');

      const structuralCase = aiService.classifyEmergency('Large tree fell through roof and collapsed wall');
      expect(structuralCase.suggestedCategory).toBe('structural');
    });
  });

  describe('findMatchingResources', () => {
    const mockResources = [
      { id: '1', title: '5KW Portable Generator', category: 'equipment', availability: 'available' },
      { id: '2', title: 'First Aid Trauma Kit & Bandages', category: 'medical', availability: 'available' },
      { id: '3', title: 'Bottled Drinking Water (100 gal)', category: 'water', availability: 'available' },
      { id: '4', title: 'Dry Blankets', category: 'clothing', availability: 'unavailable' }
    ];

    it('should match medical incidents to available medical resources first', () => {
      const matches = aiService.findMatchingResources('Severe bleeding and injury needs trauma bandage', 'medical', mockResources);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].resource.category).toBe('medical');
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(50);
    });

    it('should filter out unavailable resources', () => {
      const matches = aiService.findMatchingResources('Freezing weather blankets needed', 'clothing', mockResources);
      const matchedIds = matches.map((m) => m.resource.id);
      
      expect(matchedIds).not.toContain('4');
    });
  });

  describe('detectDuplicateReports', () => {
    const existingReports = [
      {
        id: 'rep-1',
        title: 'Downed power line on Elm Street',
        description: 'Live electrical wire sparking across roadway near Elm and 5th',
        location: 'Elm Street, Ward 3',
        status: 'reported'
      }
    ];

    it('should detect duplicate reports at same location with overlapping keywords', () => {
      const duplicates = aiService.detectDuplicateReports(
        'Electrical wire down sparking on road',
        'Elm Street, Ward 3',
        existingReports
      );

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].similarityScore).toBeGreaterThanOrEqual(35);
      expect(duplicates[0].report.id).toBe('rep-1');
    });

    it('should not flag unrelated incidents at different locations as duplicates', () => {
      const duplicates = aiService.detectDuplicateReports(
        'Basement flooded with rainwater',
        'Maple Avenue, Ward 8',
        existingReports
      );

      expect(duplicates.length).toBe(0);
    });
  });
});
