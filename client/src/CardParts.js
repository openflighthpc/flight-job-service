import styles from './CardParts.module.css';

export function CardFooter({ children }) {
  return (
    <div className={`card-footer ${styles.CardFooter}`}>
      {children}
    </div>
  );
}
