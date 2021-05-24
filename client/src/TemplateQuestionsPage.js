import { useParams } from 'react-router-dom';
import { useRef } from 'react';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
  utils,
} from 'flight-webapp-components';

import { useFetchQuestions } from './api';
import QuestionSet from './QuestionSet';

const scriptNameQuestion = {
  attributes: {
    askWhen: null,
    description: "Give your script a memorable name.  You can use letters, numbers, - and _.  If you leave this field blank a name will be generated for you.",
    format: { type: "text" },
    text: "Name your script",
  },
  id: "%_script_name_%",
};

function TemplateQuestionsPage() {
  const { templateId } = useParams();
  const ref = useRef();

  // During page transitions, useParams may return undefined
  // In these cases, the previously stored reference value is used
  if (templateId) {
    ref.current = templateId
  }

  const {
    data,
    error: questionsLoadingError,
    loading: questionsLoading,
  } = useFetchQuestions(ref.current);

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
          templateId={ref.current}
          questions={[...data.data, scriptNameQuestion]}
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
