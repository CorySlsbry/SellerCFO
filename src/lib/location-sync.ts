/**
 * Location Auto-Discovery
 *
 * Shared utility that integrations call during sync to auto-create
 * locations from QBO Classes/Departments, NextGen project sites,
 * athenahealth job addresses, Salesforce accounts, and HubSpot companies.
 *
 * Manual locations (source IS NULL) are never touched.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type LocationSource =
  | 'qbo_class'
  | 'qbo_department'
  | 'nextgen'
  | 'athenahealth'
  | 'salesforce'
  | 'hubspot';

export interface DiscoveredLocation {
  source: LocationSource;
  external_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  parent_external_id?: string; // For hierarchical QBO classes/depts
}

/**
 * Upserts auto-discovered locations into the locations table.
 *
 * - Matches on (organization_id, source, external_id) to avoid duplicates
 * - Resolves parent_id for hierarchical items (QBO sub-classes)
 * - Never modifies manually-created locations (source IS NULL)
 * - Returns a map of external_id → location UUID for downstream tagging
 */
export async function syncDiscoveredLocations(
  supabase: SupabaseClient,
  organizationId: string,
  locations: DiscoveredLocation[]
): Promise<Map<string, string>> {
  const externalToId = new Map<string, string>();

  if (locations.length === 0) return externalToId;

  // Separate root-level and child locations
  const roots = locations.filter((l) => !l.parent_external_id);
  const children = locations.filter((l) => !!l.parent_external_id);

  // Process roots first so children can resolve parent_id
  for (const loc of roots) {
    const id = await upsertLocation(supabase, organizationId, loc, null);
    if (id) externalToId.set(`${loc.source}:${loc.external_id}`, id);
  }

  // Process children (resolve parent_id from the root pass)
  for (const loc of children) {
    const parentKey = `${loc.source}:${loc.parent_external_id}`;
    const parentId = externalToId.get(parentKey) ?? null;
    const id = await upsertLocation(supabase, organizationId, loc, parentId);
    if (id) externalToId.set(`${loc.source}:${loc.external_id}`, id);
  }

  return externalToId;
}

async function upsertLocation(
  supabase: SupabaseClient,
  organizationId: string,
  loc: DiscoveredLocation,
  parentId: string | null
): Promise<string | null> {
  // Check if this location already exists
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('source', loc.source)
    .eq('external_id', loc.external_id)
    .maybeSingle();

  if (existing) {
    // Update name/address if changed
    await supabase
      .from('locations')
      .update({
        name: loc.name,
        ...(loc.address && { address: loc.address }),
        ...(loc.city && { city: loc.city }),
        ...(loc.state && { state: loc.state }),
        ...(loc.zip && { zip: loc.zip }),
        ...(parentId && { parent_id: parentId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    return existing.id;
  }

  // Insert new location
  const { data: inserted, error } = await supabase
    .from('locations')
    .insert({
      organization_id: organizationId,
      source: loc.source,
      external_id: loc.external_id,
      name: loc.name,
      address: loc.address || null,
      city: loc.city || null,
      state: loc.state || null,
      zip: loc.zip || null,
      parent_id: parentId,
      is_default: false,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to upsert location "${loc.name}" (${loc.source}:${loc.external_id}):`, error.message);
    return null;
  }

  return inserted?.id ?? null;
}

/**
 * Extracts unique city+state locations from an array of records
 * that have address/city/state fields. Used by NextGen, athenahealth,
 * Salesforce, and HubSpot to discover locations from project/contact data.
 */
export function extractCityStateLocations(
  source: LocationSource,
  records: Array<{ address?: string; city?: string; state?: string; zip?: string }>
): DiscoveredLocation[] {
  const seen = new Map<string, DiscoveredLocation>();

  for (const record of records) {
    const city = record.city?.trim();
    const state = record.state?.trim();

    // Skip records without meaningful location data
    if (!city && !state) continue;

    const key = `${(city || '').toLowerCase()}:${(state || '').toLowerCase()}`;
    if (seen.has(key)) continue;

    const name = [city, state].filter(Boolean).join(', ');
    seen.set(key, {
      source,
      external_id: key,
      name,
      city: city || undefined,
      state: state || undefined,
      address: record.address?.trim() || undefined,
      zip: record.zip?.trim() || undefined,
    });
  }

  return Array.from(seen.values());
}
