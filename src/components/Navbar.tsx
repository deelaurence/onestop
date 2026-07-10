import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

const links = [
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/about', label: 'About' },
  { to: '/book', label: 'Book' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const closeMenu = () => setOpen(false);

  return (
    <nav className={`navbar${isHome ? '' : ' navbar--solid'}`}>
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src={logo} alt="Onestop" />
        <span>Onestop</span>
      </Link>

      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="navbar-menu-btn"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`navbar-mobile${open ? ' navbar-mobile--open' : ''}`}>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
