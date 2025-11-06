// lib/serialization.ts
// Purpose: Serialize MongoDB documents for client components
// Converts ObjectIds and Dates to plain strings for Next.js 13+ Client Components

import { Types } from "mongoose";

/**
 * Serialize a single MongoDB document to plain object
 * Converts ObjectIds to strings and Dates to ISO strings
 */
export function serializeDoc<T extends Record<string, any>>(
  doc: T | null | undefined
): T | null {
  if (!doc) return null;

  const serialized = JSON.parse(JSON.stringify(doc));
  return serialized;
}

/**
 * Serialize an array of MongoDB documents
 */
export function serializeDocs<T extends Record<string, any>>(docs: T[]): T[] {
  return docs.map((doc) => serializeDoc(doc) as T);
}

/**
 * Serialize any value (handles objects, arrays, primitives)
 */
export function serialize(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serialize(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Types.ObjectId || value?._bsontype === "ObjectId") {
    return value.toString();
  }

  if (typeof value === "object") {
    const serialized: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        serialized[key] = serialize(value[key]);
      }
    }
    return serialized;
  }

  return value;
}

/**
 * Safe serialization wrapper with error handling
 */
export function safeSerialize<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Serialization error:", error);
    return data;
  }
}
