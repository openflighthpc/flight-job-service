import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
  utils,
} from './lib';

import { useFetchQuestions } from './api';
import QuestionSet from './QuestionSet';

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
    const questions = utils.getResourcesFromResponse(data);
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
