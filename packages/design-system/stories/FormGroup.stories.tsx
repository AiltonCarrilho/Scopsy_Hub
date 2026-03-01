import type { Meta, StoryObj } from '@storybook/react';
import { FormGroup } from '../components/ui/FormGroup';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';

const meta: Meta<typeof FormGroup> = {
  title: 'Components/FormGroup',
  component: FormGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FormGroup label="Email" htmlFor="email">
      <Input id="email" type="email" placeholder="your@email.com" />
    </FormGroup>
  ),
};

export const Required: Story = {
  render: () => (
    <FormGroup label="Password" htmlFor="password" required>
      <Input id="password" type="password" />
    </FormGroup>
  ),
};

export const WithHelpText: Story = {
  render: () => (
    <FormGroup
      label="Email"
      htmlFor="email"
      helpText="We'll never share your email"
    >
      <Input id="email" type="email" placeholder="your@email.com" />
    </FormGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormGroup
      label="Email"
      htmlFor="email"
      hasError
      errorMessage="Please enter a valid email"
    >
      <Input id="email" type="email" hasError />
    </FormGroup>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <FormGroup label="Therapy Type" htmlFor="therapy" required>
      <Select
        options={[
          { value: 'tcc', label: 'Cognitive Behavioral Therapy' },
          { value: 'act', label: 'Acceptance and Commitment Therapy' },
        ]}
        placeholder="Select a therapy type"
      />
    </FormGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <FormGroup
      label="Message"
      htmlFor="message"
      required
      helpText="Maximum 500 characters"
    >
      <Textarea
        id="message"
        placeholder="Enter your message..."
        maxLength={500}
        showCharCount
      />
    </FormGroup>
  ),
};
