import { changelog } from '../data/changelog'
import '../styles/changelog.css'

export function ChangelogPage() {
  return <section className="changelog-page" aria-labelledby="changelog-title">
    <header className="changelog-heading">
      <h1 id="changelog-title">Changelog</h1>
    </header>
    <ol className="changelog-timeline" aria-label="Historique des mises à jour, des plus récentes aux plus anciennes">
      {changelog.map(entry => <li className={`changelog-entry${entry.planned ? ' is-planned' : ''}`} key={entry.id}>
        <span className="changelog-marker" aria-hidden="true" />
        <div className="changelog-entry-content">
          {entry.planned && <p className="changelog-label">À venir</p>}
          <h2 className="changelog-entry-title">{entry.title}</h2>
          {entry.detail && <p className="changelog-detail">{entry.detail}</p>}
        </div>
      </li>)}
    </ol>
  </section>
}
