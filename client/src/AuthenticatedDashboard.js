import { Link } from "react-router-dom";

import { DashboardLogo, useMediaGrouping } from 'flight-webapp-components';

import { CardFooter } from './CardParts';

function AuthenticatedDashboard() {
  return (
    <div>
      <DashboardLogo />
      <Cards />
    </div>
  );
}

function Cards() {
  const cards = [
    (
      <div className="card mb-2">
        <div className="card-body fa-background fa-background-file-code-o">
          <h5 className="card-title text-center">
            Create job scripts from predefined templates
          </h5>
          <p className="card-text">
            Create job scripts customized to your needs from predefined
            templates.
          </p>
          <ol className="mb-0">
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
    ),

    (
      <div className="card mb-2">
        <div className="card-body fa-background fa-background-file-text-o">
          <h5 className="card-title text-center">
            Submit your customized job script
          </h5>
          <p className="card-text">
            Once you have created a customized job script, you can submit it
            to be executed by your cluster.
          </p>
          <ol className="mb-0">
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
    ),

    (
      <div className="card mb-2">
        <div className="card-body fa-background fa-background-tasks" >
          <h5 className="card-title text-center">
            Monitor your jobs
          </h5>
          <p className="card-text">
            Once you have submitted a job script, you can monitor your job and
            access your results.
          </p>
        </div>
        <CardFooter>
          <Link
            className="btn btn-success btn-block"
            to="/jobs"
          >
            <i className="fa fa-tasks mr-1"></i>
            <span>Monitor jobs</span>
          </Link>
        </CardFooter>
      </div>
    ),
  ];

  const { groupedItems } = useGrouping(cards);
  const decks = groupedItems.map(
    (group, index) => (
      <div key={index} className="card-deck">
        {
          group.map((item, idx) => {
            if (item == null) {
              // The `key` attribute is intentionally omitted.
              return <BlankCard />;
            } else {
              return item;
            }
          })
        }
      </div>
    )
  );
  return decks;
}

function useGrouping(items) {
  const { groupedItems, perGroup } = useMediaGrouping(
    ['(min-width: 1200px)', '(min-width: 992px)', '(min-width: 768px)', '(min-width: 576px)'],
    [2, 2, 1, 1],
    1,
    items,
  );
  if (groupedItems.length) {
    const lastGroup = groupedItems[groupedItems.length - 1];
    if (lastGroup.length < perGroup) {
      const requiredBlanks = perGroup - lastGroup.length;
      for (let i=0; i<requiredBlanks; i++) {
        lastGroup.push(null);
      }
    }
  }
  return { groupedItems, perGroup };
}

function BlankCard() {
  return <div className="card invisible"></div>;
}

export default AuthenticatedDashboard;
