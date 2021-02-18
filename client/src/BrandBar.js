import React, { useContext } from 'react';
import { Link } from "react-router-dom";
import classNames from 'classnames';

import AccountMenu from './account/Menu';
import { BrandbarLogo, BrandbarText } from './Branding';
import { Context as CurrentUserContext } from './account/CurrentUserContext';

export default function BrandBar({ className }) {
  return (
    <nav className={classNames('navbar navbar-expand-lg navbar-light bg-white', className)}>
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
          <AccountMenu />
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
