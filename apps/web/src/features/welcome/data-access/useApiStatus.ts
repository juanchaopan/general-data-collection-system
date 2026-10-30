import { useQuery } from '@tanstack/react-query';

async function fetchStatus(): Promise<'ok' | 'down'> {
  try {
    const res = await fetch('/api/v1/health');
    return res.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  }
}

/** 服务器状态放在 data-access：页面调用它，展示组件不碰它。 */
export function useApiStatus() {
  return useQuery({ queryKey: ['api-status'], queryFn: fetchStatus });
}
