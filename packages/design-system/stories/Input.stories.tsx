import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/ui/Input';
import { Mail, Lock, Eye } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      options: ['sm', 'md', 'lg'],
      control: 'radio',
    },
    hasError: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
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
    size: 'md',
    placeholder: 'Enter text...',
    type: 'text',
  },
};

export const Email: Story = {
  args: {
    size: 'md',
    placeholder: 'your@email.com',
    type: 'email',
    leftIcon: <Mail size={18} />,
  },
};

export const Password: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter password',
    type: 'password',
    leftIcon: <Lock size={18} />,
    rightIcon: <Eye size={18} />,
  },
};

export const WithError: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter your email',
    type: 'email',
    hasError: true,
    errorMessage: 'Invalid email address',
  },
};

export const Disabled: Story = {
  args: {
    size: 'md',
    placeholder: 'Disabled input',
    disabled: true,
    value: 'Cannot edit',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

export const WithLeftIcon: Story = {
  args: {
    size: 'md',
    placeholder: 'Email address',
    type: 'email',
    leftIcon: <Mail size={18} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    size: 'md',
    placeholder: 'Search...',
    leftIcon: <Mail size={18} />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', width: '100%', maxWidth: '400px' }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};
