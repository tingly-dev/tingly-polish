import type { SiteMapping } from '../types.js';
import { matchesUrlPattern, getInputSelectorsForUrl } from '../types.js';

/**
 * Re-export URL matching utilities for use in content scripts
 */
export { matchesUrlPattern, getInputSelectorsForUrl };

/**
 * Service for managing custom site input selectors
 */
export class SiteMappingService {
  /**
   * Get all input selectors that should be monitored for the current URL
   */
  static getSelectorsForCurrentUrl(siteMappings: SiteMapping[]): string[] {
    return getInputSelectorsForUrl(window.location.href, siteMappings);
  }

  /**
   * Check if a site mapping is enabled and matches the current URL
   */
  static isMappingActive(mapping: SiteMapping): boolean {
    return mapping.enabled && matchesUrlPattern(window.location.href, mapping.urlPattern);
  }

  /**
   * Get all active site mappings for the current URL
   */
  static getActiveMappings(siteMappings: SiteMapping[]): SiteMapping[] {
    return siteMappings.filter(mapping => this.isMappingActive(mapping));
  }
}
