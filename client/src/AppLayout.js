import { useContext } from 'react';
import { Redirect, Route } from "react-router-dom";

import AnimatedRouter from './lib/AnimatedRouter';
import AuthenticatedRoute from './lib/AuthenticatedRoute';
import BrandBar from './lib/BrandBar';
import Footer from './lib/Footer';
import NavItems from './NavItems';
import styles from './AppLayout.module.css';
import { Context as ConfigContext } from './lib/ConfigContext';
import { routes, unconfiguredRoutes } from './routes';

function AppLayout() {
  const { unconfigured } = useContext(ConfigContext);

  return (
    <>
    <BrandBar navItems={<NavItems />} />
    <div
      className="container-fluid"
      id="main"
    >
      <div id="toast-portal" className={styles.ToastPortal}></div>
      <div className="content">
        <AnimatedRouter
          AuthenticatedRoute={AuthenticatedRoute}
          Redirect={Redirect}
          Route={Route}
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
