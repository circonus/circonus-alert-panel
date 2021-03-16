import { PanelPlugin } from '@grafana/data';
import { CirconusAlertPanelOptions } from './types';
import { CirconusAlertPanel } from './CirconusAlertPanel';

export const plugin = new PanelPlugin<CirconusAlertPanelOptions>(CirconusAlertPanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'link',
      name: 'Drilldown Link',
      description: 'Drilldown URL for each alert listed you can use {{alert_id}} to insert the alert id into the link',
      defaultValue: '',
    })
    .addSelect({
      path: 'sort',
      name: 'Sort',
      description: 'Sort order to use for the panel',
      defaultValue: 'alert_time',
      settings: {
        options: [
          { value: 'alert_time', label: 'Alert Timestamp' },
          { value: 'priority', label: 'Alert Priority' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'hide_tags',
      name: 'Hide all tags',
      description: 'Exclude all tags from the output',
      defaultValue: false,
    })
    .addStringArray({
      path: 'exclude',
      name: 'Exclude tag categories',
      description: 'The list of tag categories to exclude from the tag listing on each alert row',
      defaultValue: [],
    });
});
