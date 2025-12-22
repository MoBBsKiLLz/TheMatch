/**
 * Text formatting utilities for consistent capitalization across the app
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 * @example capitalize('cricket') => 'Cricket'
 * @example capitalize('501') => '501'
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a game type for display with proper capitalization
 * Handles special cases like "x01" games and multi-word games
 * @param gameType - The game type to format
 * @returns The formatted game type
 * @example formatGameType('cricket') => 'Cricket'
 * @example formatGameType('501') => '501'
 * @example formatGameType('pool') => 'Pool'
 * @example formatGameType('eight_ball') => 'Eight Ball'
 */
export function formatGameType(gameType: string): string {
  if (!gameType) return gameType;

  // Handle snake_case game types
  if (gameType.includes('_')) {
    return gameType
      .split('_')
      .map(word => capitalize(word))
      .join(' ');
  }

  // Handle kebab-case game types
  if (gameType.includes('-')) {
    return gameType
      .split('-')
      .map(word => capitalize(word))
      .join(' ');
  }

  // Default: just capitalize first letter
  return capitalize(gameType);
}

/**
 * Formats a status value for display with proper capitalization
 * @param status - The status to format
 * @returns The formatted status
 * @example formatStatus('active') => 'Active'
 * @example formatStatus('in_progress') => 'In Progress'
 * @example formatStatus('completed') => 'Completed'
 */
export function formatStatus(status: string): string {
  if (!status) return status;

  // Handle snake_case status values
  if (status.includes('_')) {
    return status
      .split('_')
      .map(word => capitalize(word))
      .join(' ');
  }

  // Default: just capitalize first letter
  return capitalize(status);
}

/**
 * Formats a person's full name with proper capitalization
 * @param firstName - First name
 * @param lastName - Last name
 * @returns The formatted full name
 * @example formatPersonName('john', 'doe') => 'John Doe'
 */
export function formatPersonName(firstName: string, lastName: string): string {
  const first = capitalize(firstName || '');
  const last = capitalize(lastName || '');
  return `${first} ${last}`.trim();
}

/**
 * Converts a string to title case (capitalizes first letter of each word)
 * @param str - The string to convert
 * @returns The string in title case
 * @example toTitleCase('no winner recorded') => 'No Winner Recorded'
 * @example toTitleCase('hello world') => 'Hello World'
 */
export function toTitleCase(str: string): string {
  if (!str) return str;

  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}
