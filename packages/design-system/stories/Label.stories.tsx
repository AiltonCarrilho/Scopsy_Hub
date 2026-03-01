import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../components/ui/Label';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {
    required: {
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
    htmlFor: 'example',
    children: 'Label Text',
  },
};

export const Required: Story = {
  args: {
    htmlFor: 'email',
    required: true,
    children: 'Email Address',
  },
};

export const WithHelpText: Story = {
  args: {
    htmlFor: 'password',
    helpText: 'At least 8 characters with numbers and symbols',
    children: 'Password',
  },
};

export const RequiredWithHelp: Story = {
  args: {
    htmlFor: 'username',
    required: true,
    helpText: 'Username must be unique and 3-20 characters',
    children: 'Username',
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <div>
        <Label htmlFor="basic">Basic Label</Label>
      </div>
      <div>
        <Label htmlFor="required" required>
          Required Label
        </Label>
      </div>
      <div>
        <Label htmlFor="help" helpText="This is some helpful text">
          With Help Text
        </Label>
      </div>
      <div>
        <Label htmlFor="both" required helpText="Required field with help text">
          Required With Help
        </Label>
      </div>
    </div>
  ),
};
