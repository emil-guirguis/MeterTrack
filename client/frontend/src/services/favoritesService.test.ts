import { describe, it, expect } from 'vitest';
import { favoritesService } from './favoritesService';
import type { Favorite } from '../components/sidebar-meters/types';

/**
 * Unit Tests for FavoritesService
 * Tests the favorite checking logic
 */
describe('FavoritesService', () => {
  describe('isFavorite', () => {
    it('should return true for favorited meter', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 0,
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100);

      expect(result).toBe(true);
    });

    it('should return false for non-favorited meter', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 0,
        },
      ];

      const result = favoritesService.isFavorite(favorites, 200);

      expect(result).toBe(false);
    });

    it('should return true for favorited meter element', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 50,
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100, 50);

      expect(result).toBe(true);
    });

    it('should return false for non-favorited meter element', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 50,
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100, 60);

      expect(result).toBe(false);
    });

    it('should distinguish between meter and element favorites', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 0, // Meter favorite
        },
        {
          favorite_id: 2,
          tenant_id: 1,
          users_id: 1,
          meter_id: 100,
          meter_element_id: 50, // Element favorite
        },
      ];

      // Meter should be favorited
      expect(favoritesService.isFavorite(favorites, 100)).toBe(true);

      // Element should be favorited
      expect(favoritesService.isFavorite(favorites, 100, 50)).toBe(true);

      // Different element should not be favorited
      expect(favoritesService.isFavorite(favorites, 100, 60)).toBe(false);
    });

    it('should handle empty favorites array', () => {
      const favorites: Favorite[] = [];

      const result = favoritesService.isFavorite(favorites, 100);

      expect(result).toBe(false);
    });
  });
});
