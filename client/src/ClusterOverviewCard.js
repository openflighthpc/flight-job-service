import styles from './ClusterOverviewCard.module.css';
import { ClusterDescription, ClusterLogo } from './Branding';
import { useEnvironment } from './BrandingContext';

function ClusterName({ children }) {
  return <h5 className={styles.ClusterName}>{children}</h5>;
}

function ClusterCard() {
  const environment = useEnvironment();

  return (
    <div className="card mb-2">
      <div className="card-body">
        <h5 className="card-title text-center">
        </h5>
        <ClusterLogo />
        <div className="text-center mb-3">
          <ClusterName>{environment('environment.name')}</ClusterName>
        </div>
        <ClusterDescription />
      </div>
    </div>
  );
}

export default ClusterCard;
