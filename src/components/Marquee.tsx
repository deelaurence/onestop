export default function Marquee() {
  const items = [
    'Weddings', 'Portraits', 'School Photography', 'Passport Photos',
    'Commercial', 'Events', 'Editorial', 'Studio Sessions'
  ];

  return (
    <div className="marquee-section">
      <div className="marquee-track">
        {[...items, ...items].map((text, i) => (
          <div key={i} className="marquee-item">
            <span className="marquee-text">{text}</span>
            <span className="marquee-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}
