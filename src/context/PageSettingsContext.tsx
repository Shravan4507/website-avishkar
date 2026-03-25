import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'pages'));
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...(docSnap.data() as Partial<PageSettings>) });
        }
      } catch (error) {
        console.warn("Could not fetch page settings, using defaults:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <PageSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </PageSettingsContext.Provider>
  );
};
