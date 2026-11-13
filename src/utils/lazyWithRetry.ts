import React, { ComponentType, LazyExoticComponent } from 'react';

/**
 * Wraps React.lazy with an automatic single retry + clean error propagation
 * so transient network hiccups or post-deploy chunk hash rotations never
 * freeze the UI on an infinite Suspense skeleton.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await factory();
      } catch (secondError) {
        console.error('[SYNAPES LazyChunk] Failed to load module chunk after retry:', secondError);
        throw firstError instanceof Error ? firstError : new Error(String(secondError));
      }
    }
  });
}

