import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from '../components/ui/Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: 'tcc', label: 'Cognitive Behavioral Therapy (TCC)' },
  { value: 'act', label: 'Acceptance and Commitment Therapy (ACT)' },
  { value: 'dbt', label: 'Dialectical Behavior Therapy (DBT)' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return <Select options={options} value={value} onChange={(v) => setValue(v as string)} placeholder="Select a therapy type" />;
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string>('tcc');

    return <Select options={options} value={value} onChange={(v) => setValue(v as string)} />;
  },
};

export const Multiple: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);

    return (
      <Select
        options={options}
        value={value}
        onChange={(v) => setValue(v as string[])}
        multiple
        placeholder="Select therapy types"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    options,
    disabled: true,
    value: 'tcc',
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return <Select options={options} value={value} onChange={(v) => setValue(v as string)} size="sm" placeholder="Select..." />;
  },
};

export const Large: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return (
      <Select options={options} value={value} onChange={(v) => setValue(v as string)} size="lg" placeholder="Select a therapy type..." />
    );
  },
};
