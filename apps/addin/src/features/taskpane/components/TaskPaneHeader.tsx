import styles from './TaskPaneHeader.module.css';

interface TaskPaneHeaderProps {
  title: string;
}

/** 展示组件：任务窗格的标题栏。 */
export function TaskPaneHeader({ title }: TaskPaneHeaderProps) {
  return <h1 className={styles.title}>{title}</h1>;
}
