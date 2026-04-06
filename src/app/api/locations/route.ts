/**
 * Locations API
 * GET  /api/locations           — list all active locations for the user's org
 * POST /api/locations           — create a new location
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import type { Location } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 });
    }

    const { data: locations, error } = await (supabase as any)
      .from('locations')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: (locations ?? []) as Location[] });
  } catch (err) {
    console.error('Locations GET error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 });
    }

    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, city, state, zip, parent_id, is_default } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const { data: location, error } = await (supabase as any)
      .from('locations')
      .insert({
        organization_id: profile.organization_id,
        name: name.trim(),
        address: address?.trim() ?? null,
        city: city?.trim() ?? null,
        state: state?.trim() ?? null,
        zip: zip?.trim() ?? null,
        parent_id: parent_id ?? null,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'A location with that name already exists' }, { status: 409 });
      }
      console.error('Error creating location:', error);
      return NextResponse.json({ success: false, error: 'Failed to create location' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: location as Location }, { status: 201 });
  } catch (err) {
    console.error('Locations POST error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
