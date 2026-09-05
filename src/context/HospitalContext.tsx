import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HospitalSettings {
  hospitalName: string;
  hospitalSubname: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: HospitalSettings = {
  hospitalName: 'HOSPITAL SAN LUCAS',
  hospitalSubname: 'Broadcast Hospitalario',
  logoUrl: '',
};

interface HospitalContextValue {
  settings: HospitalSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<HospitalSettings>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
  resetToDefaults: () => Promise<boolean>;
}

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined);

const STORAGE_KEY = 'broadcast_hospital_settings';

export const HospitalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<HospitalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading hospital settings from storage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch settings from server on initial mount
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/hospital-settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.settings && isMounted) {
            setSettings((prev) => {
              const merged = { ...prev, ...data.settings };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        // Fallback to localStorage
        console.warn('Server hospital-settings query notice:', err);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (newSettings: Partial<HospitalSettings>): Promise<boolean> => {
    setIsLoading(true);
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      const res = await fetch('/api/hospital-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      });
      setIsLoading(false);
      return res.ok;
    } catch (err) {
      console.error('Error saving hospital settings to server:', err);
      setIsLoading(false);
      return false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/hospital-settings/logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const logoUrl = data.logoUrl || data.url;
        if (logoUrl) {
          await updateSettings({ logoUrl });
          setIsLoading(false);
          return logoUrl;
        }
      }
    } catch (err) {
      console.warn('Multer logo upload notice, falling back to base64 dataUrl:', err);
    }

    // Fallback: convert to base64 DataURL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await updateSettings({ logoUrl: dataUrl });
        setIsLoading(false);
        resolve(dataUrl);
      };
      reader.onerror = () => {
        setIsLoading(false);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const resetToDefaults = async (): Promise<boolean> => {
    return updateSettings(DEFAULT_SETTINGS);
  };

  return (
    <HospitalContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        uploadLogo,
        resetToDefaults,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
