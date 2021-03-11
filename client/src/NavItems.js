import { useContext } from 'react';
import { Link } from "react-router-dom";

import { CurrentUserContext, useEnvironment } from 'flight-webapp-components';

function NavItems() {
  const { currentUser } = useContext(CurrentUserContext);
  const environment = useEnvironment();

  const homeNav = (
    <li className="nav-item">
      <a
        className="nav-link nav-menu-button"
        href="/"
      >
        {environment('environment.name') || 'Home'}
      </a>
    </li>
  );

  if (currentUser == null) {
    return homeNav;
  }

  return (
    <>
    {homeNav}
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

export default NavItems;
