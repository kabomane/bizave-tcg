import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function SettingsGroup({ id, title, description, icon, children }: { id: string; title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return <details name="settings" className="settings-group" data-settings-group={id}>
    <summary><span className="settings-group-icon" aria-hidden="true">{icon}</span><span className="settings-group-label"><h2>{title}</h2><span>{description}</span></span><ChevronDown className="settings-group-chevron" size={17} aria-hidden="true" /></summary>
    <div className="settings-group-body">{children}</div>
  </details>
}
