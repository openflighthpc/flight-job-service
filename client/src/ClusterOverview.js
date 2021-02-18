import styles from './ClusterOverview.module.css';
import { ClusterDescription, ClusterLogo } from './Branding';
import { useEnvironment } from './BrandingContext';

function ClusterName({ children }) {
  return <h5 className={styles.ClusterName}>{children}</h5>;
}

function ClusterOverview() {
  const environment = useEnvironment();

  return (
    <div>
      <ClusterLogo />
      <div className="text-center mb-3">
        <ClusterName>{environment('environment.name')}</ClusterName>
      </div>
      <ClusterDescription />
    </div>
  );
}

export default ClusterOverview;
