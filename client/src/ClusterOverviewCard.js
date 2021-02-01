import { useContext, useState } from 'react';

import styles from './ClusterOverviewCard.module.css';
import { Context as ConfigContext } from './ConfigContext';

function ClusterName({ children }) {
  return <h5 className={styles.ClusterName}>{children}</h5>;
}

function ClusterCard() {
  const { clusterName, clusterLogo, clusterDescription } = useContext(ConfigContext);

  return (
    <div className="card mb-2">
      <div className="card-body">
        <h5 className="card-title text-center">
        </h5>
        { clusterLogo != null ? <ClusterLogo src={clusterLogo} /> : null }
        <div className="text-center mb-3">
          <ClusterName>{clusterName}</ClusterName>
        </div>
        { clusterDescription != null ? <p>{clusterDescription}</p> : null }
      </div>
    </div>
  );
}

function ClusterLogo({ src }) {
  const [ loaded, setLoaded ] = useState(false);
  const classes = `mw-100 mx-auto mb-3`;

  return (
    <img
      alt=""
      className={ loaded ? `${classes} d-block` : `${classes} d-none`}
      src={src}
      onLoad={() => setLoaded(true)}
    />
  );
}

export default ClusterCard;
