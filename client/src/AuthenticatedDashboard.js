import { Link } from "react-router-dom";

import { CardFooter } from './CardParts';
import Logo from './png_trans_logo.png';

function AuthenticatedDashboard() {
  return (
    <div>
      <img
        src={Logo}
        alt="OpenflightHPC Logo"
        className="center"
        width="100%"
      >
      </img>

      <div className="card-deck">
        <div className="card">
          <div className="card-body fa-background fa-background-desktop">
            <h5 className="card-title text-center">
              Create job scripts from predefined templates
            </h5>
            <p className="card-text">
              Create job scripts customized to your needs from predefined
              templates.
            </p>
            <ol>
              <li>
                Answer a few simple questions to customize the job script to
                your needs.
              </li>
              <li>
                Download your customized script.
              </li>
              <li>
                Submit your script to the cluster's scheduler.
              </li>
            </ol>
          </div>
          <CardFooter>
            <Link
              className="btn btn-success btn-block"
              to="/templates"
            >
              <i className="fa fa-file mr-1"></i>
              <span>Browse script templates</span>
            </Link>
          </CardFooter>
        </div>
      </div>
    </div>
  );
}

export default AuthenticatedDashboard;
