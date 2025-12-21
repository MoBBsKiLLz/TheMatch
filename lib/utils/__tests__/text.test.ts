import {
  capitalize,
  formatGameType,
  formatStatus,
  formatPersonName,
  toTitleCase
} from '../text';

describe('Text Utilities', () => {
  describe('capitalize', () => {
    it('should capitalize first letter of lowercase string', () => {
      expect(capitalize('cricket')).toBe('Cricket');
      expect(capitalize('pool')).toBe('Pool');
      expect(capitalize('dominos')).toBe('Dominos');
    });

    it('should capitalize first letter of mixed case string', () => {
      expect(capitalize('cricket')).toBe('Cricket');
      expect(capitalize('CRICKET')).toBe('CRICKET');
    });

    it('should handle numbers', () => {
      expect(capitalize('501')).toBe('501');
      expect(capitalize('301')).toBe('301');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('z')).toBe('Z');
    });
  });

  describe('formatGameType', () => {
    it('should capitalize simple game types', () => {
      expect(formatGameType('cricket')).toBe('Cricket');
      expect(formatGameType('pool')).toBe('Pool');
      expect(formatGameType('dominos')).toBe('Dominos');
      expect(formatGameType('uno')).toBe('Uno');
    });

    it('should handle numeric game types', () => {
      expect(formatGameType('501')).toBe('501');
      expect(formatGameType('301')).toBe('301');
    });

    it('should handle snake_case game types', () => {
      expect(formatGameType('eight_ball')).toBe('Eight Ball');
      expect(formatGameType('nine_ball')).toBe('Nine Ball');
      expect(formatGameType('custom_game')).toBe('Custom Game');
    });

    it('should handle kebab-case game types', () => {
      expect(formatGameType('eight-ball')).toBe('Eight Ball');
      expect(formatGameType('nine-ball')).toBe('Nine Ball');
      expect(formatGameType('custom-game')).toBe('Custom Game');
    });

    it('should handle empty string', () => {
      expect(formatGameType('')).toBe('');
    });

    it('should handle already capitalized types', () => {
      expect(formatGameType('Cricket')).toBe('Cricket');
      expect(formatGameType('Pool')).toBe('Pool');
    });
  });

  describe('formatStatus', () => {
    it('should capitalize simple status values', () => {
      expect(formatStatus('active')).toBe('Active');
      expect(formatStatus('completed')).toBe('Completed');
      expect(formatStatus('pending')).toBe('Pending');
    });

    it('should handle snake_case status values', () => {
      expect(formatStatus('in_progress')).toBe('In Progress');
      expect(formatStatus('not_started')).toBe('Not Started');
    });

    it('should handle empty string', () => {
      expect(formatStatus('')).toBe('');
    });

    it('should handle already capitalized status', () => {
      expect(formatStatus('Active')).toBe('Active');
      expect(formatStatus('Completed')).toBe('Completed');
    });
  });

  describe('formatPersonName', () => {
    it('should capitalize both first and last names', () => {
      expect(formatPersonName('john', 'doe')).toBe('John Doe');
      expect(formatPersonName('jane', 'smith')).toBe('Jane Smith');
    });

    it('should handle mixed case names', () => {
      expect(formatPersonName('JOHN', 'DOE')).toBe('JOHN DOE');
      expect(formatPersonName('john', 'DOE')).toBe('John DOE');
    });

    it('should handle empty first name', () => {
      expect(formatPersonName('', 'doe')).toBe('Doe');
    });

    it('should handle empty last name', () => {
      expect(formatPersonName('john', '')).toBe('John');
    });

    it('should handle both names empty', () => {
      expect(formatPersonName('', '')).toBe('');
    });

    it('should capitalize lowercase names', () => {
      expect(formatPersonName('miguel', 'zepeda')).toBe('Miguel Zepeda');
      expect(formatPersonName('alex', 'johnson')).toBe('Alex Johnson');
    });
  });

  describe('toTitleCase', () => {
    it('should capitalize each word in a sentence', () => {
      expect(toTitleCase('no winner recorded')).toBe('No Winner Recorded');
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    it('should handle already title case', () => {
      expect(toTitleCase('No Winner Recorded')).toBe('No Winner Recorded');
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should handle all uppercase', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      expect(toTitleCase('NO WINNER')).toBe('No Winner');
    });

    it('should handle single word', () => {
      expect(toTitleCase('cricket')).toBe('Cricket');
      expect(toTitleCase('pool')).toBe('Pool');
    });

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('should handle string with extra spaces', () => {
      expect(toTitleCase('hello  world')).toBe('Hello  World');
    });
  });
});
