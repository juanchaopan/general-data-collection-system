import { translate } from '@gdcs/i18n';
import { WelcomeCard } from '../components/WelcomeCard';
import { useApiStatus } from '../data-access/useApiStatus';

export function WelcomePage() {
  const { data, isPending } = useApiStatus();
  const status = isPending
    ? 'Checking the API…'
    : data === 'ok'
      ? 'API is reachable.'
      : 'API is not reachable.';
  return <WelcomeCard title={translate('en', 'app.title')} status={status} />;
}
