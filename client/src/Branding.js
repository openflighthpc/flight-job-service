import classNames from 'classnames';

import DefaultBrandbarLogo from './png_trans_logo-navbar.png';
import DefaultDashboardLogo from './png_trans_logo.png';
import styles from './Branding.module.css';
import { useBranding } from './BrandingContext';

export function BrandbarLogo() {
  const branding = useBranding();
  const logo = branding('brandbar.logo') || {
    url: DefaultBrandbarLogo,
    alt: "OpenflightHPC Logo",
  };

  return (
    <img
      alt={logo.alt}
      className={classNames(styles.BrandingBrandbarLogo, logo.classNames)}
      src={logo.url}
    />
  );
}

export function BrandbarText() {
  const branding = useBranding();

  if (branding('brandbar.text')) {
    return (
      <div className={styles.BrandingTextWrapper}>
        <span className={styles.BrandingText}>
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
    <img
      alt={logo.alt}
      className={classNames(styles.BrandingDashboardLogo, logo.classNames)}
      src={logo.url}
    />
  );
}

export function ClusterDescription() {
  const branding = useBranding();
  const description = branding('environment.description');

  if (description) {
    return <p>{description}</p>;
  } else {
    return null;
  }
}

export function ClusterLogo() {
  const branding = useBranding();
  const logo = branding('environment.logo');

  if (logo) {
    return (
      <img
        alt={logo.alt}
        className={classNames(styles.BrandingClusterLogo, logo.classNames)}
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
