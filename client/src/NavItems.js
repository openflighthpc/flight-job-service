import { useContext } from 'react';
import { Link } from "react-router-dom";

import { CurrentUserContext } from 'flight-webapp-components';

function NavItems() {
  const { currentUser } = useContext(CurrentUserContext);
  const homeNav = (
    <li className="nav-item">
      <a
        className="nav-link nav-menu-button"
        href="/"
      >
        Home
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
