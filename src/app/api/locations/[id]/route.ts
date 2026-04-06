/**
 * Single Location API
 * GET    /api/locations/[id]  — fetch one location
 * PUT    /api/locations/[id]  — update a location
 * DELETE /api/locations/[id]  — soft-delete (set is_active = false)
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import type { Location } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOrgAndRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single();
  return profile as { organization_id: string; role: string } | null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrgAndRole(supabase as any, user.id);
    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 });
    }

    const { data: location, error } = await (supabase as any)
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: location as Location });
  } catch (err) {
    console.error('Location GET [id] error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrgAndRole(supabase as any, user.id);
    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 });
    }
    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, city, state, zip, parent_id, is_default, is_active } = body;

    // Build update payload — only include fields that were sent
    const updates: Record<string, unknown> = {};
    if (name !== undefined)       updates.name       = name?.trim() ?? null;
    if (address !== undefined)    updates.address    = address?.trim() ?? null;
    if (city !== undefined)       updates.city       = city?.trim() ?? null;
    if (state !== undefined)      updates.state      = state?.trim() ?? null;
    if (zip !== undefined)        updates.zip        = zip?.trim() ?? null;
    if (parent_id !== undefined)  updates.parent_id  = parent_id ?? null;
    if (is_default !== undefined) updates.is_default = is_default;
    if (is_active !== undefined)  updates.is_active  = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const { data: location, error } = await (supabase as any)
      .from('locations')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'A location with that name already exists' }, { status: 409 });
      }
      console.error('Error updating location:', error);
      return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
    }

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: location as Location });
  } catch (err) {
    console.error('Location PUT error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrgAndRole(supabase as any, user.id);
    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 });
    }
    if (profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Only owners can delete locations' }, { status: 403 });
    }

    // Prevent deleting the default location
    const { data: existing } = await (supabase as any)
      .from('locations')
      .select('is_default')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }
    if (existing.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default location. Set another location as default first.' },
        { status: 409 }
      );
    }

    // Soft delete
    const { error } = await (supabase as any)
      .from('locations')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', profile.organization_id);

    if (error) {
      console.error('Error deleting location:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete location' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Location deactivated' });
  } catch (err) {
    console.error('Location DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
