import React from 'react';
import { PanelProps } from '@grafana/data';
import { CirconusAlertPanelOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory /* , useTheme */ } from '@grafana/ui';
import './module.css';
import { DataFrame } from '@grafana/data';
import * as Mustache from 'mustache';

interface Props extends PanelProps<CirconusAlertPanelOptions> {}

export const CirconusAlertPanel: React.FC<Props> = ({ options, data, width, height }) => {
  //const theme = useTheme();
  const styles = getStyles();
  const TAG_COLORS = [
    '#D32D20',
    '#1E72B8',
    '#B240A2',
    '#705DA0',
    '#466803',
    '#497A3C',
    '#3D71AA',
    '#B15415',
    '#890F02',
    '#6E6E6E',
    '#0A437C',
    '#6D1F62',
    '#584477',
    '#4C7A3F',
    '#2F4F4F',
    '#BF1B00',
    '#7662B1',
    '#8A2EB8',
    '#517A00',
    '#000000',
    '#3F6833',
    '#2F575E',
    '#99440A',
    '#AE561A',
    '#0E4AB4',
    '#58140C',
    '#052B51',
    '#511749',
    '#3F2B5B',
  ];

  const TAG_BORDER_COLORS = [
    '#FF7368',
    '#459EE7',
    '#E069CF',
    '#9683C6',
    '#6C8E29',
    '#76AC68',
    '#6AA4E2',
    '#E7823D',
    '#AF3528',
    '#9B9B9B',
    '#3069A2',
    '#934588',
    '#7E6A9D',
    '#88C477',
    '#557575',
    '#E54126',
    '#A694DD',
    '#B054DE',
    '#8FC426',
    '#262626',
    '#658E59',
    '#557D84',
    '#BF6A30',
    '#FF9B53',
    '#3470DA',
    '#7E3A32',
    '#2B5177',
    '#773D6F',
    '#655181',
  ];

  function djb2(str: string) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
  }

  function getTagColor(index: number) {
    return { color: TAG_COLORS[index], borderColor: TAG_BORDER_COLORS[index] };
  }

  /**
   * Returns tag badge background and border colors based on hashed tag name.
   * @param name tag name
   */
  function getTagColorsFromName(name: string) {
    const hash = djb2(name.toLowerCase());
    const index = Math.abs(hash % TAG_COLORS.length);
    return getTagColor(index);
  }

  function millisecondsToStr(milliseconds: number) {
    function numberEnding(number: number) {
      return number > 1 ? 's' : '';
    }

    let temp = Math.floor(milliseconds / 1000);
    const years = Math.floor(temp / 31536000);
    if (years) {
      return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    const days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + ' day' + numberEnding(days);
    }
    const hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + ' hour' + numberEnding(hours);
    }
    const minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
    }
    const seconds = temp % 60;
    if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
    }
    return 'just now';
  }

  function getField(f: DataFrame, name: string) {
    for (let i = 0; i < f.fields.length; i++) {
      if (f.fields[i].name === name) {
        return f.fields[i].values.get(0);
      }
    }
  }

  function getSeverityStyle(severity: number) {
    let color = '#6818B1';
    let fontColor = 'white';
    switch (severity) {
      case 1:
        color = '#C13737';
        break;
      case 2:
        color = '#F9851B';
        fontColor = 'black';
        break;
      case 3:
        color = '#FCDC01';
        fontColor = 'black';
        break;
      case 4:
        color = '#2374D9';
        break;
    }
    return {
      backgroundColor: color,
      color: fontColor,
    };
  }

  const heartSVG = (
    <div className="css-1vzus6i-Icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="alert-state-ok">
        <path d="M12,20.8623a2.75115,2.75115,0,0,1-1.94922-.80468L3.83691,13.84277A6.27238,6.27238,0,0,1,12,4.36328a6.27239,6.27239,0,0,1,8.16309,9.47949l-6.21338,6.21387A2.75,2.75,0,0,1,12,20.8623Z"></path>
      </svg>
    </div>
  );

  const heartBreakSVG = (
    <div className="css-1vzus6i-Icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        className="alert-state-alerting"
      >
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path d="M18.17,1.85h0A6.25,6.25,0,0,0,12.12.23L9.42,6.56l2.83.71a1,1,0,0,1,.67,1.41l-2,4a1,1,0,0,1-.9.56,1.13,1.13,0,0,1-.44-.1h0a1,1,0,0,1-.46-1.33l1.4-2.89-2.77-.7a1,1,0,0,1-.65-.53,1,1,0,0,1,0-.83L9.58,1a6.27,6.27,0,0,0-7.73,9.77L9.3,18.18a1,1,0,0,0,1.42,0h0l7.45-7.46A6.27,6.27,0,0,0,18.17,1.85Z"></path>
          </g>
        </g>
      </svg>
    </div>
  );

  function createItemList() {
    let itemList = [];
    if (data !== undefined && data.series.length > 0) {
      for (let i = 0; i < data.series.length; i++) {
        const dataframe = data.series[i];

        const state = getField(dataframe, 'state');
        const notes = getField(dataframe, 'notes');
        const severity = getField(dataframe, 'severity');
        const metric_name = getField(dataframe, 'metric_name');
        const tags = getField(dataframe, 'tags');
        const cleared_timestamp = getField(dataframe, 'cleared_timestamp');
        const time = getField(dataframe, 'Time');
        const alert_id = getField(dataframe, 'alert_id');

        // TODO treat absent as warning?
        const iconState = state === 'ALERTING' ? 'alerting' : 'ok';
        const iconSVG = iconState === 'alerting' ? heartBreakSVG : heartSVG;
        //const iconName = iconState === 'alerting' ? 'heart-break' : 'heart';

        let alertName = '';
        if (notes && notes !== '') {
          // attempt to parse row.notes in case it might be json
          try {
            const parsed = JSON.parse(notes);
            if (parsed['summary'] !== undefined) {
              alertName = parsed['summary'];
            } else {
              alertName = metric_name;
            }
          } catch (error) {
            alertName = notes;
          }
        } else {
          alertName = metric_name;
        }

        let alert_view_tags = [];
        if (tags && tags.length > 0) {
          alert_view_tags = tags.split('|');
        }

        let humanReadableTime = 'for ';
        const now = new Date().valueOf();
        if (cleared_timestamp !== null) {
          humanReadableTime += millisecondsToStr(now - cleared_timestamp);
        } else {
          humanReadableTime += millisecondsToStr(now - time);
        }

        let tagList = [];
        var tagDict: Record<string, string> = {};
        for (let t = 0; t < alert_view_tags.length; t++) {
          const tag = alert_view_tags[t].split(':');
          const c = tag[0];
          tagDict[c + ''] = tag[1] + '';
          if (options.exclude.indexOf(c) >= 0) {
            continue;
          }
          const colors = getTagColorsFromName(alert_view_tags[t]);
          const style = {
            backgroundColor: colors.color,
          };
          tagList.push(
            <div className="label-tag label" style={style}>
              {alert_view_tags[t]}
            </div>
          );
        }

        if (alertName) {
          alertName = Mustache.render(alertName, tagDict);
        }

        let alertDrillDownLink = undefined;
        if (options.link) {
          alertDrillDownLink = Mustache.render(options.link, { alert_id: alert_id });
        }

        itemList.push(
          <li className="alert-rule-item">
            <div className={'alert-rule-item__icon alert-state-' + iconState}>{iconSVG}</div>
            <div className="alert-rule-item__body">
              <div className="alert-rule-item__header">
                <span className="alert-rule-item__name">
                  <a href={alertDrillDownLink} target="_blank">
                    {alertName}
                  </a>{' '}
                  | {tagList}
                </span>

                <div className="alert-rule-item__text">
                  <span className={'alert-state-' + iconState}>{state}</span>
                  <span id="severity" className="label-tag label" style={getSeverityStyle(severity)}>
                    P{severity}
                  </span>
                  <span className="alert-rule-item__time">{humanReadableTime}</span>
                </div>
              </div>
            </div>
          </li>
        );
      }
    } else {
      const iconState = 'ok';
      const iconSVG = heartSVG;
      //const iconName = 'heart';

      const alertName = 'All Clear - No active alerts!';
      itemList.push(
        <li className="alert-rule-item">
          <div className={'alert-rule-item__icon alert-state-' + iconState}>{iconSVG}</div>
          <div className="alert-rule-item__body">
            <div className="alert-rule-item__header">
              <span className="alert-rule-item__name">{alertName}</span>
              <div className="alert-rule-item__text">
                <span className={'alert-state-' + iconState}>OK</span>
              </div>
            </div>
          </div>
        </li>
      );
    }
    return itemList;
  }

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <ol className="alert-rule-list" id="alert-rule-list">
        {createItemList()}
      </ol>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
  };
});
