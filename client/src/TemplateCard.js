import classNames from 'classnames';
import { Link } from "react-router-dom";

import { CardFooter } from './CardParts';

function TemplateCard({ template }) {
  return (
    <div
      className={
        classNames('card border-primary mb-2')
      }
    >
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={template.attributes.synopsis}
      >
        {template.attributes.synopsis}
      </h5>
      <div className="card-body">
        <p>
          {template.attributes.description}
        </p>
      </div>
      <CardFooter>
        <div className="btn-toolbar justify-content-center">
          <Link
            className="btn btn-sm btn-primary"
            to={`/templates/${template.id}`}
          >
            <i className="fa fa-pencil-square-o mr-1"></i>
            <span>Create script</span>
          </Link>
        </div>
      </CardFooter>
    </div>
  );
}

export default TemplateCard;
