import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Alert } from '../components/ui/Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    description: 'This is an informational alert message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    description: 'Your action has been completed successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    description: 'Please review this before proceeding.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    description: 'Something went wrong. Please try again.',
  },
};

export const Dismissible: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    return (
      <Alert
        variant="warning"
        title="Dismissible Alert"
        description="This alert can be closed"
        dismissible
        onClose={() => setIsOpen(false)}
      />
    );
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Alert variant="info" title="Info" description="Information message" />
      <Alert variant="success" title="Success" description="Success message" />
      <Alert variant="warning" title="Warning" description="Warning message" />
      <Alert variant="error" title="Error" description="Error message" />
    </div>
  ),
};
