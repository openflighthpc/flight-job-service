import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
  utils,
} from 'flight-webapp-components';

import { useFetchQuestions } from './api';
import QuestionSet from './QuestionSet';

function TemplateQuestionsPage() {
  const { templateId } = useParams();
  const {
    data,
    error: questionsLoadingError,
    loading: questionsLoading,
  } = useFetchQuestions(templateId);

  if (questionsLoading) {
    return <Loading />;
  } else if (questionsLoadingError) {
    return <DefaultErrorMessage />;
  } else {
    const questions = utils.getResourcesFromResponse(data);
    if ( questions == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <QuestionSet
          templateId={templateId}
          questions={data.data}
        />
      );
    }
  }
}

function Loading() {
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
