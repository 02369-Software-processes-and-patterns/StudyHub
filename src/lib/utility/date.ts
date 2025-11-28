/**
 * Date utility functions for formatting and parsing dates.
 */

/**
 * Format an ISO date string for use in datetime-local input.
 * Returns format: YYYY-MM-DDTHH:MM
 */
export function formatDatetimeLocal(isoString: string): string {
	try {
		const date = new Date(isoString);
		if (isNaN(date.getTime())) return '';

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	} catch {
		return '';
	}
}

/**
 * Format a Date object for use in date input (YYYY-MM-DD).
 */
export function formatDateForInput(date: Date): string {
	try {
		if (isNaN(date.getTime())) return '';

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	} catch {
		return '';
	}
}

/**
 * Get a datetime string for tomorrow (used as default deadline).
 * Returns format: YYYY-MM-DDTHH:MM
 */
export function getTomorrowDatetime(): string {
	const now = Date.now();
	const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
	return formatDatetimeLocal(tomorrow.toISOString());
}

/**
 * Extract just the date portion from an ISO string (first 10 chars).
 * Returns format: YYYY-MM-DD
 */
export function extractDateFromISO(isoString: string | null | undefined): string {
	if (!isoString) return '';
	return isoString.substring(0, 10);
}

/**
 * Extract datetime for input from an ISO string (first 16 chars).
 * Returns format: YYYY-MM-DDTHH:MM
 */
export function extractDatetimeFromISO(isoString: string | null | undefined): string {
	if (!isoString) return '';
	return isoString.substring(0, 16);
}
