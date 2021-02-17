import classNames from 'classnames';

import DefaultBrandbarLogo from './png_trans_logo-navbar.png';
import DefaultDashboardLogo from './png_trans_logo.png';
import { useBranding, useEnvironment } from './BrandingContext';

export function BrandbarLogo() {
  const branding = useBranding();
  const logo = branding('brandbar.logo') || {
    url: DefaultBrandbarLogo,
    alt: "OpenflightHPC Logo",
    height: "75"
  };

  return (
    <img
      alt={logo.alt}
      className={classNames(logo.classNames, 'branding-brandbar-logo')}
      src={logo.url}
      height={logo.height}
    />
  );
}

export function BrandbarText() {
  const branding = useBranding();

  if (branding('brandbar.text')) {
    return (
      <div className="branding-brandbar-text-wrapper">
        <span className="branding-brandbar-text">
          {branding('brandbar.text')}
        </span>
      </div>
    );
  } else {
    return null;
  }
}

export function DashboardLogo() {
  const branding = useBranding();
  const logo = branding('apps.dashboard.logo') || {
    url: DefaultDashboardLogo,
    alt: "OpenflightHPC Logo",
  };

  return (
    <div className="branding-apps-dashboard-logo-wrapper">
      <img
        alt={logo.alt}
        className={classNames(
          'logo',
          logo.classNames,
          'branding-apps-dashboard-logo'
        )}
        src={logo.url}
      />
    </div>
  );
}

export function ClusterDescription() {
  const environment = useEnvironment();
  const description = environment('environment.description');

  if (description) {
    return <p>{description}</p>;
  } else {
    return null;
  }
}

export function ClusterLogo() {
  const environment = useEnvironment();
  const logo = environment('environment.logo');

  if (logo) {
    return (
      <img
        alt={logo.alt}
        className={classNames('logo', logo.classNames)}
        src={logo.url}
      />
    );
  } else {
    return null;
  }
}

// function UnbreakableImg({ src }) {
//   const [ loaded, setLoaded ] = useState(false);
//   const classes = `mw-100 mx-auto mb-3`;

//   return (
//     <img
//       alt=""
//       className={ loaded ? `${classes} d-block` : `${classes} d-none`}
//       src={src}
//       onLoad={() => setLoaded(true)}
//     />
//   );
// }
