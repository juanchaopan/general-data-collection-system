import type { RouteObject } from 'react-router';
import { WelcomePage } from '../features/welcome/pages/WelcomePage';

export const routes: RouteObject[] = [{ path: '/', element: <WelcomePage /> }];
