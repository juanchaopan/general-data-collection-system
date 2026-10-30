import { translate } from '@gdcs/i18n';
import { TaskPaneHeader } from '../components/TaskPaneHeader';

export function TaskPanePage() {
  return <TaskPaneHeader title={translate('en', 'app.title')} />;
}
