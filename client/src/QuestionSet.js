import React, { useReducer, useRef } from 'react';
import classNames from 'classnames';
import { Button } from 'reactstrap';

import styles from './question.module.css';
import { CardFooter } from './CardParts';
import { useDownloadScript } from './api';
import { useToast } from './ToastContext';

function shouldAsk(question, state) {
  const ask_when = question.attributes['ask-when'];
  if (ask_when == null) { return true; }

  // `ask_when` is of the format
  //
  // {
  //   value: `question.<question id>.answer`,
  //   eq: <dependency value>,
  // }
  //
  // This is the only format currently supported: checking an answer to a
  // question for equality against a given value.

  const qId = ask_when.value.split('.')[1];
  const dependency = state.answers.find(a => a.question.id === qId);
  return ask_when.eq === dependency.valueOrDefault();
}

function initialState(questions) {
  return {
    answers: questions.map(q => ({
      question: q,
      value: "",
      valueOrDefault() {
        return this.value === "" ? this.question.attributes.default : this.value;
      },
    })),
    currentQuestion: 0,
  };
}

function reducer(state, action) {
  let nqi; // Next question index.

  switch (action.type) {
    case 'change':
      return {
        ...state,
        answers: [
          ...state.answers.slice(0, state.currentQuestion),
          {
            ...state.answers[state.currentQuestion],
            value: action.value,
          },
          ...state.answers.slice(state.currentQuestion + 1),
        ]
      };
    case 'next':
      nqi = state.currentQuestion + 1;
      for (; nqi < state.answers.length; nqi++) {
        let candidateQuestion = state.answers[nqi].question;
        if (shouldAsk(candidateQuestion, state)) {
          break;
        }
      }
      return { ...state, currentQuestion: nqi };
    case 'previous':
      nqi = state.currentQuestion - 1;
      for (; nqi >= 0; nqi--) {
        let candidateQuestion = state.answers[nqi].question;
        if (shouldAsk(candidateQuestion, state)) {
          break;
        }
      }
      return { ...state, currentQuestion: nqi };
    default:
      return state;
  }
}

function QuestionSet({ templateId, questions }) {
  const [state, dispatch] = useReducer(reducer, initialState(questions));

  if (state.currentQuestion < questions.length) {
    const currentAnswer = state.answers[state.currentQuestion];

    return (
      <Question
        answer={currentAnswer}
        isFirstQuestion={state.currentQuestion === 0}
        isLastQuestion={state.currentQuestion === questions.length - 1}
        onChange={(ev) => dispatch({ type: 'change', value: ev.target.value })}
        onNext={() => dispatch({ type: 'next' })}
        onPrevious={() => dispatch({ type: 'previous' })}
        question={currentAnswer.question}
      />
    );
  } else {
    return (
      <Summary
        answers={state.answers}
        onEditAnswers={() => dispatch({ type: 'previous' })}
        state={state}
        templateId={templateId}
      />
    );
  }
}

function Question({
  answer,
  isFirstQuestion,
  isLastQuestion,
  onChange,
  onNext,
  onPrevious,
  question,
}) {
  return (
    <div className={`card border-primary ${styles.QuestionCard}`} >
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={question.attributes.text}
      >
        {question.attributes.text}
      </h5>
      <div className="card-body">
        <p>{question.attributes.description}</p>
        <p>
          <span className="font-weight-bold">Default: </span>
          {question.attributes.default}
        </p>
        <QuestionInput
          answer={answer}
          onChange={onChange}
          question={question}
        />
      </div>
      <CardFooter>
        <div className="btn-toolbar justify-content-end">
          {
            isFirstQuestion ?
              null :
              <Button
                color="secondary"
                onClick={onPrevious}
              >
                <i className="fa fa-chevron-left mr-1" />
                Back
              </Button>
          }
          <Button
            className="ml-2"
            color="primary"
            onClick={onNext}
          >
            {
              isLastQuestion ?
                null :
                <i className="fa fa-chevron-right mr-1" />
            }
            { isLastQuestion ? 'Finish' : 'Next' }
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}

function Summary({ answers, onEditAnswers, state, templateId }) {
  const answerSummary = answers.map((answer, idx) => {
    if (shouldAsk(answer.question, state)) {
      return (
        <React.Fragment key={idx}>
          <dt>{answer.question.attributes.text}</dt>
          <dd className="mb-3 ml-3">{answer.valueOrDefault()}</dd>
        </React.Fragment>
      );
    } else {
      return null;
    }
  });

  return (
    <div className={`card border-primary ${styles.SummaryCard}`} >
      <h5 className="card-header bg-primary text-light text-truncate">
        Summary
      </h5>
      <div className="card-body">
        <dl>
          {answerSummary}
        </dl>
      </div>
      <CardFooter>
        <div className="btn-toolbar justify-content-end">
          <Button
            color="secondary"
            onClick={onEditAnswers}
          >
            <i className="fa fa-chevron-left mr-1" />
            Back
          </Button>
          <DownloadButton
            className="ml-2"
            answers={answers}
            state={state}
            templateId={templateId}
          />
        </div>
      </CardFooter>
    </div>
  );
}

function DownloadButton({ answers, className, state, templateId }) {
  const anchorRef = useRef(null);
  const { addToast } = useToast();

  const flattenedAnswers = answers.reduce((accum, answer) => {
    if (shouldAsk(answer.question, state)) {
      accum[answer.question.id] = answer.valueOrDefault();
    } else {
      accum[answer.question.id] = answer.question.attributes.default;
    }
    return accum;
  }, {});

  const { loading, post, response } = useDownloadScript(templateId, flattenedAnswers);

  const download = () => {
    post().then(() => {
      if (response.ok) {
        response.blob().then(blob => {
          const url = URL.createObjectURL(blob);
          anchorRef.current.href = url;
          anchorRef.current.click();
        });
      } else {
        addToast({
          body: (
            <div>
              Unfortunately there has been a problem rendering your job
              script.  Please try again and, if problems persist, help us to
              more quickly rectify the problem by contacting us and letting us
              know.
            </div>
          ),
          icon: 'danger',
          header: 'Failed to render template',
        });
      }
    });
  }

  const buttonText = loading ? 'Downloading...' : 'Download job script';

  return (
    <React.Fragment>
      <Button
        color="primary"
        onClick={download}
        className={classNames(className, { 'disabled': loading })}
        disabled={loading}
      >
        <i className="fa fa-download mr-1" />
        {buttonText}
      </Button>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a
        href={null}
        download={templateId}
        ref={anchorRef}
      >
      </a>
    </React.Fragment>
  );
}

function QuestionInput({ answer, onChange, question }) {
  const format = question.attributes.format;

  switch (format.type) {
    case 'multiline_text':
      return (
        <textarea
          className="w-100"
          id={question.id}
          name={question.id}
          onChange={onChange}
          placeholder={question.attributes.default}
          value={answer.value}
          onClick={() => {
            if (answer.value === "") {
              onChange({ target: { value: question.attributes.default }})
            }
          }}
          rows={10}
        />
      );
    case 'select':
      const options = format.options.map(option => (
        <option key={option.value} value={option.value}>{option.text}</option>
      ));
      return (
        <select
          onChange={(ev) => {
            const selectedOption = ev.target.options[ev.target.selectedIndex];
            onChange({target: { value: selectedOption.value }});
          }}
          value={answer.value}
        >
          {options}
        </select>
      );
    case 'text':
    default:
      return (
        <input
          className="w-100"
          id={question.id}
          name={question.id}
          onChange={onChange}
          placeholder={question.attributes.default}
          type="text"
          value={answer.value}
        />
      );
  }
}

export default QuestionSet;
