import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface PageSettings {
  home: boolean;
  workshops: boolean;
  competitions: boolean;
  team: boolean;
  schedule: boolean;
  sponsors: boolean;
  contact: boolean;
}

const defaultSettings: PageSettings = {
  home: true,
  workshops: true,
  competitions: true,
  team: true,
  schedule: true,
  sponsors: true,
  contact: true,
};

interface PageSettingsContextType {
  settings: PageSettings;
  loading: boolean;
}

const PageSettingsContext = createContext<PageSettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const usePageSettings = () => useContext(PageSettingsContext);

export const PageSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'pages'),
      (docSnap) => {
        if (docSnap.exists()) {
          // Merge fetched data with defaults (in case a key is missing)
          setSettings({ ...defaultSettings, ...(docSnap.data() as Partial<PageSettings>) });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching page settings:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <PageSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </PageSettingsContext.Provider>
  );
};
