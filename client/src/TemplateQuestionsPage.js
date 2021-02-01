import { useParams } from 'react-router-dom';

import { useFetchQuestions } from './api';
import { DefaultErrorMessage } from './ErrorBoundary';
import Overlay from './Overlay';
import Spinner from './Spinner';
import QuestionSet from './QuestionSet';
import { getResourcesFromResponse } from './utils';

function TemplateQuestionsPage() {
  const { id } = useParams();
  const {
    data,
    error: questionsLoadingError,
    loading: questionsLoading,
  } = useFetchQuestions(id);

  if (questionsLoading) {
    return <Loading id={id} />;
  } else if (questionsLoadingError) {
    return <DefaultErrorMessage />;
  } else {
    const questions = getResourcesFromResponse(data);
    if ( questions == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <QuestionSet
          templateId={id}
          questions={data.data}
        />
      );
    }
  }
}

function Loading({ id }) {
  return (
    <Layout>
      <Overlay>
        <Spinner text="Loading template questions..." />
      </Overlay>
    </Layout>
  );
}

function Layout({
  children,
  questions,
}) {
  return (
    <div>
      {children}
    </div>
  );
}

export default TemplateQuestionsPage;
