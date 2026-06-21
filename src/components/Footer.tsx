import { Link } from 'react-router-dom';
import { InstagramIcon, TikTokIcon } from './Icons';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link to="/" className="footer-logo">
          <img src={logo} alt="Onestop" />
          <span>Onestop</span>
        </Link>
        <ul className="footer-nav">
          <li><Link to="/portfolio">Portfolio</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        <div className="footer-socials">
          <a href="#" aria-label="Instagram"><InstagramIcon /></a>
          <a href="#" aria-label="TikTok"><TikTokIcon /></a>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Onestop Photography — All Rights Reserved</div>
      </div>
    </footer>
  );
}
