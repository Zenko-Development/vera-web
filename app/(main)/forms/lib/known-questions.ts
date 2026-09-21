const storageKey = (versionId: string) => `vera:forms:known-questions:${versionId}`;

export function readKnownQuestionIds(versionId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(versionId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0))] : [];
  } catch {
    return [];
  }
}

export function rememberQuestionId(versionId: string, questionId: string) {
  try {
    localStorage.setItem(storageKey(versionId), JSON.stringify([...new Set([...readKnownQuestionIds(versionId), questionId])]));
  } catch {
    // The API mutation succeeded even when browser storage is unavailable.
  }
}

export function forgetQuestionId(versionId: string, questionId: string) {
  try {
    localStorage.setItem(storageKey(versionId), JSON.stringify(readKnownQuestionIds(versionId).filter((id) => id !== questionId)));
  } catch {
    // Browser storage is optional; do not mask a successful API deletion.
  }
}
