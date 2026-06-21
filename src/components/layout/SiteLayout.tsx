import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function SiteLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <Navbar />
      <main className={isHome ? 'site-main site-main--home' : 'site-main site-main--page'}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
