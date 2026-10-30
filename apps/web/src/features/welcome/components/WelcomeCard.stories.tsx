import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelcomeCard } from './WelcomeCard';

const meta = {
  title: 'welcome/WelcomeCard',
  component: WelcomeCard,
  args: { title: 'General Data Collection System', status: 'API is reachable.' },
} satisfies Meta<typeof WelcomeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reachable: Story = {};

export const Loading: Story = { args: { status: 'Checking the API…' } };

export const Unreachable: Story = { args: { status: 'API is not reachable.' } };

export const French: Story = {
  args: { title: 'Système général de collecte de données', status: "L'API est accessible." },
};

export const LongText: Story = {
  args: {
    title:
      'A very long system title that keeps going to check how the card wraps on narrow screens',
    status:
      'This status message is intentionally long so that wrapping and overflow behaviour is visible.',
  },
};
