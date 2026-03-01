import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <Toast
          type="success"
          title="Success!"
          description="Your changes have been saved."
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          duration={0}
        />
      </>
    );
  },
};

export const Error: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Toast
        type="error"
        title="Error"
        description="Something went wrong. Please try again."
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        duration={0}
      />
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Toast
        type="warning"
        title="Connection Lost"
        description="We lost connection to the server."
        action={{ label: 'Retry', onClick: () => {} }}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        duration={0}
      />
    );
  },
};

export const AutoDismiss: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <Toast
          type="info"
          title="Info"
          description="This toast will auto-dismiss in 3 seconds."
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          duration={3000}
        />
      </>
    );
  },
};
