import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from 'react-aria-components';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

const queryClient = new QueryClient();

export function App({
  router = createBrowserRouter(routes),
}: {
  router?: ReturnType<typeof createBrowserRouter>;
}) {
  return (
    <I18nProvider locale="en">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
