'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatAddress(loc: Location) {
  return [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ') || '—';
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  parent_id: string;
  is_default: boolean;
}

const EMPTY_FORM: LocationFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  parent_id: '',
  is_default: false,
};

function LocationForm({
  initial,
  locations,
  editingId,
  onSave,
  onCancel,
}: {
  initial: LocationFormData;
  locations: Location[];
  editingId: string | null;
  onSave: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<LocationFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof LocationFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Parents: exclude the location being edited and its descendants
  const parentOptions = locations.filter((l) => l.id !== editingId);

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg bg-[#0a0a0f] border border-[#2a2a3d] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">Name *</label>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Main Office" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">Parent Location</label>
          <select className={inputClass} value={form.parent_id} onChange={set('parent_id')}>
            <option value="">— None (top-level) —</option>
            {parentOptions.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">Address</label>
          <input className={inputClass} value={form.address} onChange={set('address')} placeholder="123 Main St" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">City</label>
          <input className={inputClass} value={form.city} onChange={set('city')} placeholder="Denver" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">State</label>
          <input className={inputClass} value={form.state} onChange={set('state')} placeholder="CO" maxLength={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888a0] mb-1">ZIP</label>
          <input className={inputClass} value={form.zip} onChange={set('zip')} placeholder="80202" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={set('is_default')}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-[#e8e8f0]">Set as default location</span>
      </label>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Saving...' : editingId ? 'Update Location' : 'Create Location'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/locations');
      const json = await res.json();
      if (json.success) setLocations(json.data ?? []);
    } catch (e) {
      console.error('Failed to load locations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string, ok: boolean) => {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleCreate = async (form: LocationFormData) => {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        parent_id: form.parent_id || null,
        is_default: form.is_default,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to create');
    flash('Location created', true);
    setShowForm(false);
    load();
  };

  const handleUpdate = async (form: LocationFormData) => {
    const res = await fetch(`/api/locations/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        parent_id: form.parent_id || null,
        is_default: form.is_default,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to update');
    flash('Location updated', true);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      flash(json.error ?? 'Failed to delete location', false);
    } else {
      flash('Location removed', true);
      load();
    }
    setDeletingId(null);
  };

  const setDefault = async (loc: Location) => {
    const res = await fetch(`/api/locations/${loc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    });
    const json = await res.json();
    if (!json.success) {
      flash(json.error ?? 'Failed to set default', false);
    } else {
      flash(`"${loc.name}" is now the default location`, true);
      load();
    }
  };

  const editingLoc = editingId ? locations.find((l) => l.id === editingId) : null;
  const editInitial: LocationFormData = editingLoc
    ? {
        name: editingLoc.name,
        address: editingLoc.address ?? '',
        city: editingLoc.city ?? '',
        state: editingLoc.state ?? '',
        zip: editingLoc.zip ?? '',
        parent_id: editingLoc.parent_id ?? '',
        is_default: editingLoc.is_default,
      }
    : EMPTY_FORM;

  // Hierarchy: roots first, then their children indented
  const roots = locations.filter((l) => !l.parent_id);
  const childrenOf = (id: string) => locations.filter((l) => l.parent_id === id);
  const ordered: Array<{ loc: Location; depth: number }> = [];
  const walk = (loc: Location, depth: number) => {
    ordered.push({ loc, depth });
    childrenOf(loc.id).forEach((c) => walk(c, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <MapPin size={28} className="text-[#06b6d4]" />
            Locations
          </h1>
          <p className="text-[#8888a0]">
            Manage your offices, job sites, and regional divisions. Use the sidebar selector to filter dashboard data by location.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Add Location
          </Button>
        )}
      </div>

      {/* Status flash */}
      {statusMsg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
            statusMsg.ok
              ? 'bg-green-900/20 border border-green-700/50 text-green-400'
              : 'bg-red-900/20 border border-red-700/50 text-red-400'
          }`}
        >
          {statusMsg.ok ? <Check size={16} /> : <X size={16} />}
          {statusMsg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Location</h2>
          <LocationForm
            initial={EMPTY_FORM}
            locations={locations}
            editingId={null}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {/* Location list */}
      <Card className="p-6">
        {loading ? (
          <div className="py-8 text-center text-[#8888a0]">Loading locations…</div>
        ) : ordered.length === 0 ? (
          <div className="py-8 text-center text-[#8888a0]">
            No locations yet.{' '}
            <button
              className="text-[#06b6d4] hover:underline"
              onClick={() => setShowForm(true)}
            >
              Add your first location
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {ordered.map(({ loc, depth }) => (
              <div key={loc.id}>
                {/* Row */}
                {editingId === loc.id ? (
                  <div className="bg-[#1a1a26] rounded-lg p-4 border border-[#06b6d4]/40">
                    <h3 className="text-sm font-semibold mb-3 text-[#e8e8f0]">Editing — {loc.name}</h3>
                    <LocationForm
                      initial={editInitial}
                      locations={locations}
                      editingId={loc.id}
                      onSave={handleUpdate}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : deletingId === loc.id ? (
                  <div
                    className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded-lg"
                    style={{ marginLeft: depth * 24 }}
                  >
                    <span className="text-sm text-red-300">
                      Remove <strong>{loc.name}</strong>? This cannot be undone.
                    </span>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>
                        Keep
                      </Button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg hover:bg-[#1e1e2e] transition-colors group"
                    style={{ marginLeft: depth * 24 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin
                        size={16}
                        className={loc.is_default ? 'text-[#06b6d4]' : 'text-[#8888a0]'}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#e8e8f0] truncate">{loc.name}</span>
                          {loc.is_default && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#06b6d4] font-semibold uppercase tracking-wide">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#8888a0] mt-0.5 truncate">{formatAddress(loc)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!loc.is_default && (
                        <button
                          onClick={() => setDefault(loc)}
                          title="Set as default"
                          className="p-1.5 text-[#8888a0] hover:text-[#06b6d4] hover:bg-[#06b6d4]/10 rounded transition-colors text-xs"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingId(loc.id); setShowForm(false); }}
                        title="Edit"
                        className="p-1.5 text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] rounded transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      {!loc.is_default && (
                        <button
                          onClick={() => setDeletingId(loc.id)}
                          title="Remove"
                          className="p-1.5 text-[#8888a0] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info card */}
      <Card className="p-5 border-[#06b6d4]/20 bg-[#06b6d4]/5">
        <h3 className="text-sm font-semibold text-[#e8e8f0] mb-2 flex items-center gap-2">
          <MapPin size={14} className="text-[#06b6d4]" />
          How location filtering works
        </h3>
        <ul className="text-xs text-[#8888a0] space-y-1 list-disc list-inside">
          <li>Select a location from the sidebar to filter all dashboard data to that location.</li>
          <li>Projects, invoices, deals, and contacts can be assigned to a location during sync or manually.</li>
          <li>Parent/child hierarchy lets you view an entire region or drill into a specific job site.</li>
          <li>The default location is pre-selected when you first open the dashboard.</li>
        </ul>
      </Card>
    </div>
  );
}
