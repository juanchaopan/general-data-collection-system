import '@gdcs/tokens/tokens.css';
import '../src/app/global.css';
import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'error'：无障碍违规让 CI 失败（AA 违规不允许进入主干）
      test: 'error',
    },
  },
};

export default preview;
