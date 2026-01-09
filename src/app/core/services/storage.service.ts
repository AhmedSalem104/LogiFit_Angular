import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Get item from localStorage
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Get string item (no JSON parsing)
   */
  getString(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Set string item (no JSON stringify)
   */
  setString(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}
