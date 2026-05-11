/** localStorage 기반 MMKV 호환 심 (웹 전용) */
function createLocalStorageShim(id: string) {
  const prefix = `${id}:`;

  return {
    getString(key: string): string | undefined {
      try {
        return localStorage.getItem(prefix + key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    set(key: string, value: string | number | boolean): void {
      try {
        localStorage.setItem(prefix + key, String(value));
      } catch (e) {
        // localStorage unavailable (incognito quota exceeded 등)
      }
    },
    delete(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch (e) {
        // localStorage unavailable
      }
    },
    contains(key: string): boolean {
      try {
        return localStorage.getItem(prefix + key) !== null;
      } catch {
        return false;
      }
    },
    clearAll(): void {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(prefix))
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        // localStorage unavailable
      }
    },
  };
}

export const draftStorage = createLocalStorageShim('hermit-drafts');
