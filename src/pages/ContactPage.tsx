import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="standalone-page standalone-page--contact">
      <header className="standalone-page-header">
        <span className="standalone-page-label">Contact</span>
        <h1>Let's create something <em>timeless</em></h1>
        <p>
          Tell us about your wedding, portrait session, school shoot, or commercial project.
          We respond within one business day.
        </p>
      </header>

      <div className="contact-page-grid">
        <div className="contact-card">
          <div className="contact-card-icon"><Mail size={20} /></div>
          <h3>Email</h3>
          <a href="mailto:hello@onestopphotography.org">hello@onestopphotography.org</a>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon"><Phone size={20} /></div>
          <h3>Phone</h3>
          <a href="tel:+1234567890">+1 (234) 567 890</a>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon"><MapPin size={20} /></div>
          <h3>Based In</h3>
          <p>Canada — available for international commissions</p>
        </div>
      </div>

      <div className="contact-cta-block">
        <h2>Ready to book your session?</h2>
        <p>Share your date, location, and vision. We'll confirm availability and next steps.</p>
        <Link to="/book" className="cta-button contact-cta-button">
          Check Availability <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
