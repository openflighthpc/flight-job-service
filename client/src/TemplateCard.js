import ReactMarkdown from 'react-markdown'
import classNames from 'classnames';
import { Link } from "react-router-dom";

import { CardFooter } from './CardParts';

function TemplateCard({ className, template }) {

  return (
    <div className={classNames('card border-primary', className)}>
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={template.attributes.name}
      >
        {template.attributes.name}
      </h5>
      <div className="card-body">
        <ReactMarkdown>
          {template.attributes.synopsis}
        </ReactMarkdown>
        <ReactMarkdown>
          {template.attributes.description}
        </ReactMarkdown>
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
