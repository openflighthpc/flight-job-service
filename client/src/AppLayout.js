import { useContext } from 'react';

import styles from './AppLayout.module.css';
import AnimatedRouter from './AnimatedRouter';
import BrandBar from './BrandBar';
import Footer from './Footer';
import { Context as ConfigContext } from './ConfigContext';
import { routes, unconfiguredRoutes } from './routes';

function AppLayout() {
  const { unconfigured } = useContext(ConfigContext);

  return (
    <>
    <BrandBar />
    <div
      className="container-fluid"
      id="main"
    >
      <div id="toast-portal" className={styles.ToastPortal}></div>
      <div className="content">
        <AnimatedRouter
          exact={!unconfigured}
          routes={unconfigured ? unconfiguredRoutes : routes}
          sideNav={SideNav}
        />
      </div>
    </div>
    <Footer />
    </>
  );
}

function SideNav() {
  return (
    <div className="sidenav col-sm-2"></div>
  );
}

export default AppLayout;
