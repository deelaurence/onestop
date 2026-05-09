import { InstagramIcon, TikTokIcon } from './Icons';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <img src={logo} alt="Onestop" />
          <span>Onestop</span>
        </div>
        <ul className="footer-nav">
          <li><a href="#portfolio">Portfolio</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="footer-socials">
          <a href="#"><InstagramIcon /></a>
          <a href="#"><TikTokIcon /></a>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Onestop Photography — All Rights Reserved</div>
      </div>
    </footer>
  );
}
