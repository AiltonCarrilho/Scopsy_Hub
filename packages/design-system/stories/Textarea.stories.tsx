import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../components/ui/Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const WithCharCount: Story = {
  args: {
    placeholder: 'Enter your message...',
    maxLength: 200,
    showCharCount: true,
  },
};

export const AutoGrow: Story = {
  args: {
    placeholder: 'This textarea grows with your text...',
    autoGrow: true,
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Enter your message...',
    hasError: true,
    errorMessage: 'Message is required',
  },
};

export const Small: Story = {
  args: {
    placeholder: 'Small textarea',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    placeholder: 'Large textarea for detailed feedback',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
};
