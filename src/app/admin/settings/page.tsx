'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewSignups: true,
    emailNotifications: true,
    automatedSyncs: true,
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-[#8888a0] mt-2">Platform configuration and controls</p>
      </div>

      {/* Warning Banner */}
      {settings.maintenanceMode && (
        <Card className="p-4 bg-[#eab308]/20 border-[#eab308]/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-[#eab308]" size={20} />
            <p className="text-[#facc15] font-medium">
              Maintenance mode is enabled. Users cannot access the platform.
            </p>
          </div>
        </Card>
      )}

      {/* General Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">General Settings</h2>

        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 border border-[#2a2a3d] rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-[#8888a0] mt-1">
                Prevent users from accessing the platform
              </p>
            </div>
            <button
              onClick={() => handleToggle('maintenanceMode')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-[#ef4444]' : 'bg-[#2a2a3d]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Allow New Signups */}
          <div className="flex items-center justify-between p-4 border border-[#2a2a3d] rounded-lg">
            <div>
              <p className="font-medium">Allow New Signups</p>
              <p className="text-sm text-[#8888a0] mt-1">
                Enable or disable new user registrations
              </p>
            </div>
            <button
              onClick={() => handleToggle('allowNewSignups')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.allowNewSignups ? 'bg-[#22c55e]' : 'bg-[#2a2a3d]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.allowNewSignups ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border border-[#2a2a3d] rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-[#8888a0] mt-1">
                Send system notifications to admins
              </p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-[#22c55e]' : 'bg-[#2a2a3d]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Automated Syncs */}
          <div className="flex items-center justify-between p-4 border border-[#2a2a3d] rounded-lg">
            <div>
              <p className="font-medium">Automated Syncs</p>
              <p className="text-sm text-[#8888a0] mt-1">
                Allow scheduled integration syncs
              </p>
            </div>
            <button
              onClick={() => handleToggle('automatedSyncs')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.automatedSyncs ? 'bg-[#22c55e]' : 'bg-[#2a2a3d]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.automatedSyncs ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white font-medium rounded-lg transition-all"
          >
            <Save size={18} />
            Save Changes
          </button>
          {saved && (
            <Badge variant="success">
              ✓ Changes saved
            </Badge>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-[#ef4444]/30">
        <h2 className="text-lg font-semibold mb-6 text-[#ef4444]">Danger Zone</h2>

        <div className="space-y-3">
          <button className="w-full px-4 py-2 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-all font-medium">
            Clear All Cache
          </button>
          <button className="w-full px-4 py-2 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-all font-medium">
            Sync All Organizations
          </button>
          <button className="w-full px-4 py-2 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-all font-medium">
            Archive Old Records
          </button>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-[#1a1a26] border-[#06b6d4]/30">
        <h3 className="font-semibold mb-2">Platform Information</h3>
        <div className="space-y-2 text-sm text-[#8888a0]">
          <p>Version: 1.0.0</p>
          <p>Environment: Production</p>
          <p>Database: Supabase PostgreSQL</p>
          <p>Last Deploy: {new Date().toLocaleDateString()}</p>
        </div>
      </Card>
    </div>
  );
}
