/**
 * Admin Errors Endpoint
 * GET /api/admin/errors - Returns error logs with pagination
 * PATCH /api/admin/errors - Resolve an error
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

async function verifyAdminAccess(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_platform_admin');
    if (error) {
      console.error('is_platform_admin RPC error:', error);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const orgId = searchParams.get('org_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = (supabase as any).from('error_logs').select(
      `
      *,
      organization:organizations(id, name, slug)
    `,
      { count: 'exact' }
    );

    // Apply filters
    if (type) {
      query = query.eq('error_type', type);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (resolved !== null && resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    // Order, paginate, and execute
    const { data: errorLogs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      errors: errorLogs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { error_id, resolved } = body;

    if (!error_id || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: error_id and resolved are required' },
        { status: 400 }
      );
    }

    // Update error log
    const updateData: any = {
      resolved,
    };

    if (resolved) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    } else {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { data: updatedError, error } = await (supabase as any)
      .from('error_logs')
      .update(updateData)
      .eq('id', error_id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update error log' },
        { status: 500 }
      );
    }

    if (!updatedError) {
      return NextResponse.json({ error: 'Error log not found' }, { status: 404 });
    }

    return NextResponse.json({ error: updatedError });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
