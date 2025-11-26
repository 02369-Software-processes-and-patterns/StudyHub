import { describe, it, expect } from 'vitest';

/**
 * Validation logic for ownership transfer - extracted for unit testing
 */
interface TransferValidationInput {
    currentUserId: string;
    currentOwnerId: string;
    newOwnerId: string;
    memberIds: string[];
}

interface TransferValidationResult {
    isValid: boolean;
    errors: string[];
}

function validateOwnershipTransfer(input: TransferValidationInput): TransferValidationResult {
    const errors: string[] = [];

    // Check if current user is the owner
    if (input.currentUserId !== input.currentOwnerId) {
        errors.push('Only the current owner can transfer ownership');
    }

    // Check if trying to transfer to self
    if (input.newOwnerId === input.currentUserId) {
        errors.push('Cannot transfer ownership to yourself');
    }

    // Check if new owner is a member
    if (!input.memberIds.includes(input.newOwnerId)) {
        errors.push('New owner must be a project member');
    }

    // Check for missing fields
    if (!input.currentUserId) {
        errors.push('Current user ID is required');
    }

    if (!input.newOwnerId) {
        errors.push('New owner ID is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

describe('Ownership Transfer - Unit Tests', () => {
    describe('validateOwnershipTransfer', () => {
        it('should validate successful transfer', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: 'member-456',
                memberIds: ['owner-123', 'member-456', 'member-789']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject if current user is not owner', () => {
            const input: TransferValidationInput = {
                currentUserId: 'member-456',
                currentOwnerId: 'owner-123',
                newOwnerId: 'member-789',
                memberIds: ['owner-123', 'member-456', 'member-789']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Only the current owner can transfer ownership');
        });

        it('should reject transfer to self', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: 'owner-123',
                memberIds: ['owner-123', 'member-456']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Cannot transfer ownership to yourself');
        });

        it('should reject if new owner is not a member', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: 'non-member-999',
                memberIds: ['owner-123', 'member-456']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('New owner must be a project member');
        });

        it('should reject missing current user ID', () => {
            const input: TransferValidationInput = {
                currentUserId: '',
                currentOwnerId: 'owner-123',
                newOwnerId: 'member-456',
                memberIds: ['owner-123', 'member-456']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Current user ID is required');
        });

        it('should reject missing new owner ID', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: '',
                memberIds: ['owner-123', 'member-456']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('New owner ID is required');
        });

        it('should accumulate multiple errors', () => {
            const input: TransferValidationInput = {
                currentUserId: 'member-456',
                currentOwnerId: 'owner-123',
                newOwnerId: 'non-member-999',
                memberIds: ['owner-123', 'member-456']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty member list', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: 'member-456',
                memberIds: []
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('New owner must be a project member');
        });

        it('should handle single member (owner only)', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-123',
                currentOwnerId: 'owner-123',
                newOwnerId: 'owner-123',
                memberIds: ['owner-123']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Cannot transfer ownership to yourself');
        });

        it('should handle special characters in IDs', () => {
            const input: TransferValidationInput = {
                currentUserId: 'owner-with-uuid-123-456',
                currentOwnerId: 'owner-with-uuid-123-456',
                newOwnerId: 'member-with-uuid-789-012',
                memberIds: ['owner-with-uuid-123-456', 'member-with-uuid-789-012']
            };

            const result = validateOwnershipTransfer(input);

            expect(result.isValid).toBe(true);
        });
    });
});