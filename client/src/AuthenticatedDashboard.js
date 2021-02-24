import { Link } from "react-router-dom";

import { CardFooter } from './CardParts';
import { DashboardLogo } from './lib';

function AuthenticatedDashboard() {
  return (
    <div>
      <DashboardLogo />
      <div className="card-deck">
        <div className="card">
          <div className="card-body fa-background fa-background-file-code-o">
            <h5 className="card-title text-center">
              Create job scripts from predefined templates
            </h5>
            <p className="card-text">
              Create job scripts customized to your needs from predefined
              templates.
            </p>
            <ol>
              <li>
                Answer a few simple questions.
              </li>
              <li>
                Save the customized job script to your cluster.
              </li>
            </ol>
          </div>
          <CardFooter>
            <Link
              className="btn btn-success btn-block"
              to="/templates"
            >
              <i className="fa fa-file-code-o mr-1"></i>
              <span>Browse script templates</span>
            </Link>
          </CardFooter>
        </div>

        <div className="card">
          <div className="card-body fa-background fa-background-file-text-o">
            <h5 className="card-title text-center">
              Submit your customized job script
            </h5>
            <p className="card-text">
              Once you have created a customized job script, you can submit it
              to be executed by your cluster.
            </p>
            <ol>
              <li>
                Select the script to submit.
              </li>
              <li>
                Submit your script to the cluster's scheduler.
              </li>
            </ol>
          </div>
          <CardFooter>
            <Link
              className="btn btn-success btn-block"
              to="/scripts"
            >
              <i className="fa fa-file-text-o mr-1"></i>
              <span>Browse scripts</span>
            </Link>
          </CardFooter>
        </div>
      </div>
    </div>
  );
}

export default AuthenticatedDashboard;
