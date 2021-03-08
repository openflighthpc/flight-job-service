import { Link } from "react-router-dom";

import { CardFooter } from './CardParts';

function TemplateCard({ template }) {

  return (
    <div className="card border-primary">
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={template.attributes.name}
      >
        {template.attributes.name}
      </h5>
      <div className="card-body">
        <p>
          {template.attributes.synopsis}
        </p>
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
