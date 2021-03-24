import React, { useReducer } from 'react';
import ReactMarkdown from 'react-markdown'
import Select from 'react-select'
import classNames from 'classnames';
import { Button } from 'reactstrap';
import { useHistory } from "react-router-dom";

import styles from './question.module.css';
import { CardFooter } from './CardParts';
import { useGenerateScript } from './api';
import { useToast } from './ToastContext';

function shouldAsk(question, state) {
  const ask_when = question.attributes.askWhen;
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
      valueOrNull() {
        return this.value === "" ? null : this.value;
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
        <ReactMarkdown>{question.attributes.description}</ReactMarkdown>
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
    const format = answer.question.attributes.format;
    if (shouldAsk(answer.question, state)) {
      let formattedAnswer;
      if (format.type === 'multiline_text') {
        formattedAnswer = <code><pre>{answer.valueOrDefault()}</pre></code>;
      } else if (format.type === 'select' || format.type === 'multiselect') {
        const isMulti = format.type === 'multiselect';
        const answeredValue = isMulti ?
          answer.valueOrDefault() :
          [answer.valueOrDefault()];
        formattedAnswer = format.options
          .filter(o => answeredValue.includes(o.value))
          .map(o => o.text);
        formattedAnswer = isMulti ? formattedAnswer.join(',') : formattedAnswer[0];

      } else {
        formattedAnswer = answer.valueOrDefault();
      }
      return (
        <React.Fragment key={idx}>
          <dt>{answer.question.attributes.text}</dt>
          <dd className="mb-3 ml-3">{formattedAnswer}</dd>
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
          <SaveButton
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

function SaveButton({ answers, className, state, templateId }) {
  const { addToast } = useToast();
  const history = useHistory();

  const flattenedAnswers = answers.reduce((accum, answer) => {
    if (shouldAsk(answer.question, state)) {
      accum[answer.question.id] = answer.valueOrNull();
    }
    return accum;
  }, {});

  const { loading, post, response } = useGenerateScript(templateId, flattenedAnswers);

  const submit = async () => {
    await post()
    if (response.ok) {
      history.push('/scripts');
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
  }

  const buttonText = loading ? 'Saving...' : 'Save job script';

  return (
    <React.Fragment>
      <Button
        color="primary"
        onClick={submit}
        className={classNames(className, { 'disabled': loading })}
        disabled={loading}
      >
        <i className="fa fa-save mr-1" />
        {buttonText}
      </Button>
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
    case 'multiselect':
      const options = format.options.map(option => (
        { value: option.value, label: option.text }
      ));
      const isMulti = format.type === 'multiselect';
      let defaultValue;
      if (isMulti) {
        defaultValue = options.filter(o => question.attributes.default.includes(o.value));
      } else {
        defaultValue = options.filter(o => o.value === question.attributes.default);
      }
      let value;
      if (answer.value === "") {
        value = undefined;
      } else {
        const answeredValue = isMulti ? answer.value : [answer.value];
        value = options.filter(o => answeredValue.includes(o.value));
        value = isMulti ? value : value[0];
      }

      return (
        <Select
          defaultValue={isMulti ? defaultValue : defaultValue[0]}
          isMulti={isMulti}
          isClearable={isMulti}
          onChange={(selectedOption) => {
            const value = isMulti ?
              selectedOption.map(o => o.value) :
              selectedOption.value;
            onChange({target: { value: value }});
          }}
          options={options}
          value={value}
        />
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
