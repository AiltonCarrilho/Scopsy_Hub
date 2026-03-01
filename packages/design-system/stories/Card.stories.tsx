import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['default', 'elevated', 'outlined'],
      control: 'radio',
    },
    padding: {
      options: ['sm', 'md', 'lg'],
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
    padding: 'md',
    children: (
      <div>
        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Card Title
        </h3>
        <p>This is a default card with subtle border styling.</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: (
      <div>
        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Elevated Card
        </h3>
        <p>This card has a shadow for more depth and prominence.</p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    padding: 'md',
    children: (
      <div>
        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Outlined Card
        </h3>
        <p>This card has a more prominent border with transparent background.</p>
      </div>
    ),
  },
};

export const WithBadge: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontWeight: 'bold' }}>Progress Card</h3>
          <Badge variant="success">Completed</Badge>
        </div>
        <p>You've successfully completed the TCC fundamentals module.</p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    variant: 'default',
    padding: 'sm',
    children: <p>Compact card with small padding</p>,
  },
};

export const LargePadding: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: (
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-md)' }}>
          Feature Highlight
        </h2>
        <p>Cards with large padding provide ample breathing room for content and create a spacious feel.</p>
      </div>
    ),
  },
};
