export default function PersonaBar({ personas, current, onChange }) {
  return (
    <nav className="personas" aria-label="Customer personas">
      <span className="personas-label">Viewing the app as</span>
      {personas.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`persona-chip ${p.id === current ? 'active' : ''}`}
          onClick={() => onChange(p.id)}
        >
          <span className="persona-name">{p.name}</span>
          <span className="persona-tag">{p.tagline}</span>
        </button>
      ))}
    </nav>
  );
}
