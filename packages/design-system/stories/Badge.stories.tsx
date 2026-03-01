import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['default', 'success', 'warning', 'error', 'primary'],
      control: 'radio',
    },
    size: {
      options: ['sm', 'md'],
      control: 'radio',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    children: 'Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    size: 'md',
    children: '✓ Completed',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    size: 'md',
    children: 'In Progress',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    size: 'md',
    children: 'Failed',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'TCC Mastery',
  },
};

export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm',
    children: 'Small Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="primary">Primary</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

export const Achievement: Story = {
  args: {
    variant: 'success',
    size: 'md',
    children: '🏆 Achievement Unlocked',
  },
};

export const Module: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Module: ACT',
  },
};
