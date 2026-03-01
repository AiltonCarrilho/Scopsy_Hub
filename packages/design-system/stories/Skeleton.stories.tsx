import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonGroup } from '../components/ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextSkeleton: Story = {
  args: {
    variant: 'text',
    width: '100%',
    height: '20px',
  },
};

export const CircularSkeleton: Story = {
  args: {
    variant: 'circular',
    width: '60px',
    height: '60px',
  },
};

export const RectangularSkeleton: Story = {
  args: {
    variant: 'rectangular',
    width: '300px',
    height: '200px',
  },
};

export const PulsAnimation: Story = {
  args: {
    variant: 'text',
    width: '100%',
    height: '20px',
    animation: 'pulse',
  },
};

export const WaveAnimation: Story = {
  args: {
    variant: 'rectangular',
    width: '300px',
    height: '200px',
    animation: 'wave',
  },
};

export const NoAnimation: Story = {
  args: {
    variant: 'text',
    width: '100%',
    height: '20px',
    animation: 'none',
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        gap: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Skeleton variant="text" width="120px" height="24px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="rectangular" width="100%" height="150px" />
    </div>
  ),
};

export const SkeletonGroupExample: Story = {
  render: () => <SkeletonGroup count={5} variant="text" />,
};

export const LoadingList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Skeleton variant="circular" width="40px" height="40px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Skeleton variant="text" width="80%" height="16px" />
            <Skeleton variant="text" width="60%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  ),
};
