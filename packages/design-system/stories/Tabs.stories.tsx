import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabList, TabTrigger, TabContent } from '../components/ui/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabList>
        <TabTrigger value="tab1">Tab 1</TabTrigger>
        <TabTrigger value="tab2">Tab 2</TabTrigger>
        <TabTrigger value="tab3">Tab 3</TabTrigger>
      </TabList>
      <TabContent value="tab1">Content for Tab 1</TabContent>
      <TabContent value="tab2">Content for Tab 2</TabContent>
      <TabContent value="tab3">Content for Tab 3</TabContent>
    </Tabs>
  ),
};

export const TherapyTypes: Story = {
  render: () => (
    <Tabs defaultValue="tcc">
      <TabList>
        <TabTrigger value="tcc">TCC</TabTrigger>
        <TabTrigger value="act">ACT</TabTrigger>
        <TabTrigger value="dbt">DBT</TabTrigger>
      </TabList>
      <TabContent value="tcc">
        <h3>Cognitive Behavioral Therapy</h3>
        <p>Focus on identifying and changing negative thought patterns and behaviors.</p>
      </TabContent>
      <TabContent value="act">
        <h3>Acceptance and Commitment Therapy</h3>
        <p>Focus on acceptance, mindfulness, and commitment to personal values.</p>
      </TabContent>
      <TabContent value="dbt">
        <h3>Dialectical Behavior Therapy</h3>
        <p>Focus on dialectics, mindfulness, and acceptance with change strategies.</p>
      </TabContent>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabList>
        <TabTrigger value="tab1">Available</TabTrigger>
        <TabTrigger value="tab2" disabled>
          Locked
        </TabTrigger>
        <TabTrigger value="tab3">Available</TabTrigger>
      </TabList>
      <TabContent value="tab1">Content 1</TabContent>
      <TabContent value="tab3">Content 3</TabContent>
    </Tabs>
  ),
};
