import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox, Radio } from '../components/ui/Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <Checkbox
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        label="I agree to the terms"
      />
    );
  },
};

export const Checked: Story = {
  render: () => {
    return <Checkbox checked label="Option is selected" onChange={() => {}} />;
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <Checkbox
        checked
        disabled
        label="This checkbox is disabled"
        onChange={() => {}}
      />
    );
  },
};

export const Small: Story = {
  render: () => {
    return <Checkbox size="sm" label="Small checkbox" onChange={() => {}} />;
  },
};

export const Large: Story = {
  render: () => {
    return <Checkbox size="lg" label="Large checkbox" onChange={() => {}} />;
  },
};

// Radio stories
const RadioMeta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
};

export const RadioDefault = () => {
  const [selected, setSelected] = useState('option1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Radio
        name="group1"
        value="option1"
        checked={selected === 'option1'}
        onChange={(e) => setSelected(e.target.value)}
        label="Option 1"
      />
      <Radio
        name="group1"
        value="option2"
        checked={selected === 'option2'}
        onChange={(e) => setSelected(e.target.value)}
        label="Option 2"
      />
      <Radio
        name="group1"
        value="option3"
        checked={selected === 'option3'}
        onChange={(e) => setSelected(e.target.value)}
        label="Option 3"
      />
    </div>
  );
};

RadioDefault.parameters = {
  title: 'Components/Radio',
};
