import * as React from 'react';

interface MeditationSettings {
  inhale_seconds: number;
  hold_seconds: number;
  exhale_seconds: number;
  sound_enabled: number;
}

export function useMeditationSettings() {
  const [settings, setSettings] = React.useState<MeditationSettings>({
    inhale_seconds: 6,
    hold_seconds: 5,
    exhale_seconds: 6,
    sound_enabled: 1
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meditation/settings');
      if (!response.ok) throw new Error('Failed to fetch meditation settings');
      const data = await response.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = React.useCallback(async (newSettings: MeditationSettings) => {
    try {
      const response = await fetch('/api/meditation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Failed to update meditation settings');
      setSettings(newSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}