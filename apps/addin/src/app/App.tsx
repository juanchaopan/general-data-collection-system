import { I18nProvider } from 'react-aria-components';
import { TaskPanePage } from '../features/taskpane/pages/TaskPanePage';

export function App() {
  return (
    <I18nProvider locale="en">
      <TaskPanePage />
    </I18nProvider>
  );
}
