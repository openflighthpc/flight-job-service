import classNames from 'classnames';
import {
  ClusterLogo ,
  useEnvironment,
} from 'flight-webapp-components';

import styles from './ClusterOverview.module.css';

function ClusterName({ children }) {
  return <h5 className={styles.ClusterName}>{children}</h5>;
}

function ClusterOverview({ className }) {
  const environment = useEnvironment();

  return (
    <div className={classNames(className)}>
      <div className="text-center">
        <ClusterName>{environment('environment.name')}</ClusterName>
      </div>
      <ClusterLogo />
    </div>
  );
}

export default ClusterOverview;
