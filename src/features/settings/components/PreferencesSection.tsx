import { usePreferences, setPreferences, type Preferences } from '../preferences'
import { SettingsSection } from './SettingsParts'

function Choice<K extends keyof Preferences>({ name, legend, value, options, help }: { name: K; legend: string; value: Preferences[K]; options: { value: Preferences[K]; label: string }[]; help: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <p className="mt-0.5 text-sm text-muted">{help}</p>
      <div className="mt-3 inline-flex rounded-xl bg-canvas p-1">
        {options.map((o) => (
          <label key={o.label} className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet/20 ${value === o.value ? 'bg-white text-violet shadow-sm' : 'text-muted hover:text-ink'}`}>
            <input type="radio" name={name} checked={value === o.value} onChange={() => setPreferences({ [name]: o.value } as Partial<Preferences>)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function PreferencesSection() {
  const prefs = usePreferences()
  return (
    <SettingsSection id="preferences" title="Interface" description="Saved in this browser only. These never leave your device.">
      <Choice name="motion" legend="Animation" value={prefs.motion} help="“System” follows your operating system’s reduced-motion setting." options={[{ value: 'system', label: 'Follow system' }, { value: 'reduce', label: 'Reduce motion' }]} />
      <Choice name="textSize" legend="Text size" value={prefs.textSize} help="Scales text and spacing across the app." options={[{ value: 'default', label: 'Default' }, { value: 'large', label: 'Large' }]} />
    </SettingsSection>
  )
}
