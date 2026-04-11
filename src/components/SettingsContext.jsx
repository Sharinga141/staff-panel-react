import { createContext, useContext, useState, useEffect } from 'react'
import { getSettings } from '../lib/api'

const SettingsContext = createContext({})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    panel_name: 'RÉFÉRENCEMENT GOUV',
    panel_subtitle: "Panel d'administration",
    panel_logo: null
  })

  useEffect(() => {
    getSettings().then(data => {
      if (data && Object.keys(data).length > 0) setSettings(data)
    })
  }, [])

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}