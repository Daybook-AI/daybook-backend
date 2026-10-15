import { createHash } from 'node:crypto';

function canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, val]) => [key, canonicalize(val)]),
        );
    }

    return value;
}

export function createContentHash(content: unknown): string {
    const normalizedContent = JSON.stringify(canonicalize(content));

    return createHash('sha256')
        .update(normalizedContent, 'utf8')
        .digest('hex');
}