import styles from './WelcomeCard.module.css';

interface WelcomeCardProps {
  title: string;
  status: string;
}

/** 展示组件：只管显示，数据由页面通过 props 传入。 */
export function WelcomeCard({ title, status }: WelcomeCardProps) {
  return (
    <section className={styles.card}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.status}>{status}</p>
    </section>
  );
}
