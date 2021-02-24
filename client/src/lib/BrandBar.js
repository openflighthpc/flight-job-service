import React from 'react';
import classNames from 'classnames';

import AccountMenu from './account/Menu';
import { BrandbarLogo, BrandbarText } from './Branding';

export default function BrandBar({ className, navItems }) {
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
          {navItems}
        </ul>
        <ul className="navbar-nav">
          <AccountMenu />
        </ul>
      </div>

    </nav>
  );
}

