import RawTimeAgo from 'react-timeago';

function TimeAgo({ date }) {
  return (
    <RawTimeAgo
      date={date}
      minPeriod={5}
      formatter={(_v, unit, suffix, _e, nextFormatter) => (
        unit === 'second' ?
        `A few seconds ${suffix}` :
        nextFormatter()
      )}
    />
  );
}

export default TimeAgo;
