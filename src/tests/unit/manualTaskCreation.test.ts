import { describe, it, expect } from 'vitest';

/**
 * Task validation logic extracted from tasks/+page.server.ts for testing
 */
interface TaskInput {
	name?: string;
	effort_hours?: string;
	course_id?: string;
	deadline?: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: string[];
	processedData?: {
		name: string;
		effort_hours: number;
		course_id: string | null;
		deadline: string | null;
	};
}

function validateTaskInput(input: TaskInput): ValidationResult {
	const errors: string[] = [];

	// Validate name
	const name = input.name?.trim();
	if (!name) {
		errors.push('Missing name');
	}

	// Validate effort_hours
	const effortStr = input.effort_hours?.toString();
	if (!effortStr) {
		errors.push('Missing effort_hours');
	}

	let effort_hours = 0;
	if (effortStr) {
		effort_hours = Number.parseFloat(effortStr);
		if (!Number.isFinite(effort_hours) || effort_hours < 0) {
			errors.push('effort_hours must be a non-negative number');
		}
		effort_hours = Math.round(effort_hours);
	}

	// Process course_id
	const course_id = input.course_id?.toString() || null;

	// Process deadline
	let deadline: string | null = null;
	if (input.deadline) {
		const d = new Date(input.deadline);
		deadline = isNaN(d.getTime()) ? input.deadline : d.toISOString();
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		errors: [],
		processedData: {
			name: name!,
			effort_hours,
			course_id,
			deadline
		}
	};
}

describe('Manual Task Creation - Unit Tests', () => {
	describe('validateTaskInput', () => {
		it('should validate required fields correctly', () => {
			const invalidInput: TaskInput = {};
			const result = validateTaskInput(invalidInput);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Missing name');
			expect(result.errors).toContain('Missing effort_hours');
		});

		it('should accept valid task input', () => {
			const validInput: TaskInput = {
				name: 'Complete assignment',
				effort_hours: '2.5',
				course_id: 'course-123',
				deadline: '2024-12-01T15:00:00Z'
			};

			const result = validateTaskInput(validInput);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.processedData?.name).toBe('Complete assignment');
			expect(result.processedData?.effort_hours).toBe(3); // rounded from 2.5
		});

		it('should handle missing optional fields', () => {
			const input: TaskInput = {
				name: 'Study for exam',
				effort_hours: '4'
			};

			const result = validateTaskInput(input);

			expect(result.isValid).toBe(true);
			expect(result.processedData?.course_id).toBe(null);
			expect(result.processedData?.deadline).toBe(null);
		});

		it('should trim whitespace from name', () => {
			const input: TaskInput = {
				name: '  Whitespace task  ',
				effort_hours: '1'
			};

			const result = validateTaskInput(input);

			expect(result.isValid).toBe(true);
			expect(result.processedData?.name).toBe('Whitespace task');
		});

		it('should reject empty name after trimming', () => {
			const input: TaskInput = {
				name: '   ',
				effort_hours: '1'
			};

			const result = validateTaskInput(input);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Missing name');
		});

		it('should validate effort_hours as number', () => {
			const testCases = [
				{ input: 'invalid', expectValid: false },
				{ input: '-1', expectValid: false },
				{ input: '0', expectValid: true },
				{ input: '2.5', expectValid: true },
				{ input: '10', expectValid: true }
			];

			testCases.forEach(({ input, expectValid }) => {
				const result = validateTaskInput({
					name: 'Test task',
					effort_hours: input
				});

				expect(result.isValid).toBe(expectValid);
			});
		});

		it('should round effort_hours to integer', () => {
			const testCases = [
				{ input: '2.3', expected: 2 },
				{ input: '2.7', expected: 3 },
				{ input: '5.0', expected: 5 }
			];

			testCases.forEach(({ input, expected }) => {
				const result = validateTaskInput({
					name: 'Test task',
					effort_hours: input
				});

				expect(result.processedData?.effort_hours).toBe(expected);
			});
		});

		it('should handle deadline formatting', () => {
			const validDeadline = '2024-12-01T15:00:00';
			const result = validateTaskInput({
				name: 'Test task',
				effort_hours: '2',
				deadline: validDeadline
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it('should handle invalid deadline gracefully', () => {
			const invalidDeadline = 'not-a-date';
			const result = validateTaskInput({
				name: 'Test task',
				effort_hours: '2',
				deadline: invalidDeadline
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.deadline).toBe(invalidDeadline);
		});
	});

	describe('Edge Cases', () => {
		it('should handle extremely long names', () => {
			const longName = 'a'.repeat(1000);
			const result = validateTaskInput({
				name: longName,
				effort_hours: '1'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.name).toBe(longName);
		});

		it('should handle very large effort_hours', () => {
			const result = validateTaskInput({
				name: 'Marathon task',
				effort_hours: '1000.7'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.effort_hours).toBe(1001);
		});

		it('should handle Unicode characters in name', () => {
			const unicodeName = 'Opgave 🎯 математика';
			const result = validateTaskInput({
				name: unicodeName,
				effort_hours: '2'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.name).toBe(unicodeName);
		});
	});
});
