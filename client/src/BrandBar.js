import React, { useContext } from 'react';
import { Link } from "react-router-dom";

import styles from './BrandBar.module.css';
import { BrandbarLogo, BrandbarText } from './Branding';
import { Context as CurrentUserContext } from './CurrentUserContext';
import { useEnvironment } from './BrandingContext';

export default function BrandBar({ className }) {
  return (
    <nav className={`navbar navbar-expand-lg navbar-light bg-white border-bottom ${styles.BrandBar} ${className}`}>
      <a
        className="navbar-brand"
        href="/"
      >
        <BrandbarLogo />
      </a>
      <BrandbarText />

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav mr-auto">
          <NavItems />
        </ul>
        <ul className="navbar-nav">
          <UserNavItems />
        </ul>
      </div>

    </nav>
  );
}

function NavItems() {
  const { currentUser } = useContext(CurrentUserContext);
  if (currentUser == null) { return null; }

  return (
    <>
    <li className="nav-item">
      <Link
        className="nav-link nav-menu-button"
        to="/"
      >
        Job Scripts
      </Link>
    </li>
    <li className="nav-item">
      <Link
        className="nav-link nav-menu-button"
        to="/templates"
      >
        Templates
      </Link>
    </li>
    <li className="nav-item">
      <Link
        className="nav-link nav-menu-button"
        to="/scripts"
      >
        Scripts
      </Link>
    </li>
    </>
  );
}

function UserNavItems() {
  const { currentUser, actions } = useContext(CurrentUserContext);
  const environment = useEnvironment();
  if (currentUser == null) { return null; }

  const formattedClusterName = environment('environment.name') ?
    <span>({environment('environment.name')})</span> :
    null;

  return (
    <>
    <li className="nav-item">
      <span className="nav-link nav-menu-text">
        {currentUser.username} {formattedClusterName}
      </span>
    </li>
    <li className="nav-item">
      <button
        className="btn btn-link nav-link nav-menu-button"
        onClick={actions.signOut}
      >
        Sign out
      </button>
    </li>
    </>
  );
}
