// @ts-ignore - fast-json-patch types
import { compare } from 'fast-json-patch';
import { omit } from 'lodash';

/**
 * Fields that should be ignored when calculating diffs
 */
const FIELDS_TO_IGNORE = [
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'publishedAt',
];

/**
 * Clean data by removing system fields that shouldn't be tracked
 */
const cleanData = (data: any) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  return omit(data, FIELDS_TO_IGNORE);
};

/**
 * Calculate the diff between old and new data
 */
const calculateDiff = (oldData: any, newData: any) => {
  const cleanOld = cleanData(oldData);
  const cleanNew = cleanData(newData);

  try {
    const patches = compare(cleanOld || {}, cleanNew || {});
    return patches;
  } catch (error) {
    console.error('Error calculating diff:', error);
    return [];
  }
};

/**
 * Extract changed fields from diff patches
 */
const extractChangedFields = (patches: any[]) => {
  const changedFields: Record<string, { old: any; new: any }> = {};

  for (const patch of patches) {
    // Extract field name from path (e.g., "/title" -> "title")
    const fieldName = patch.path.split('/').filter(Boolean)[0];

    if (fieldName && !FIELDS_TO_IGNORE.includes(fieldName)) {
      if (!changedFields[fieldName]) {
        changedFields[fieldName] = {
          old: undefined,
          new: undefined,
        };
      }

      if (patch.op === 'replace' || patch.op === 'add') {
        changedFields[fieldName].new = patch.value;
      }

      if (patch.op === 'replace' || patch.op === 'remove') {
        // For replace, we need to track the old value
        // This is a simplified version; in practice, you might need the old data
        changedFields[fieldName].old = patch.op === 'remove' ? 'deleted' : undefined;
      }
    }
  }

  return changedFields;
};

export default {
  calculateDiff,
  extractChangedFields,
  cleanData,
};

