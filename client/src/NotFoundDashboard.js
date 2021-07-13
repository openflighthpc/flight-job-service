import React from 'react';
import { Link } from 'react-router-dom';

import { DashboardLogo } from 'flight-webapp-components';

import ClusterOverview from './ClusterOverview';

import { Card, CardHeader, CardBody, CardFooter } from 'reactstrap';

function NotFoundDashboard() {
  return (
    <div>
      <DashboardLogo />
      <ClusterOverview className="mt-2 mb-2" />
      <Card>
        <CardHeader className="bg-warning text-light text-truncate" title="404 - Not Found">404 - Not Found</CardHeader>
        <CardBody>This is not the page you are looking for!</CardBody>
        <CardFooter>
          <div className="btn-toolbar justify-content-center">
            <Link
              className="btn btn-sm btn-primary"
              to="/"
            >
              <i className="fa fa-undo mr-1"></i>
              <span>Move Along...</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}


export default NotFoundDashboard;
