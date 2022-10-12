import React, { useEffect } from 'react';

import { Button, VerticalGroup } from '@grafana/ui';
import cn from 'classnames/bind';

import PluginLink from 'components/PluginLink/PluginLink';
import Text from 'components/Text/Text';
import { ChangeTeamIcon } from 'icons';
import { GrafanaTeam } from 'models/grafana_team/grafana_team.types';
import { Agent, defaultMetas, ErrorsInstrumentation, initializeAgent } from '@grafana/agent-web';
import { openWarningNotification } from 'utils';

import styles from './PageErrorHandlingWrapper.module.css';
import { RootStore } from 'state';

const cx = cn.bind(styles);

export interface PageBaseState {
  errorData: PageErrorData;
}

export interface PageErrorData {
  isNotFoundError?: boolean;
  isWrongTeamError?: boolean;
  wrongTeamNoPermissions?: boolean;
  switchToTeam?: { name: string; id: string };
}

interface PageErrorHandlingWrapperProps {
  errorData?: PageErrorData;
  objectName?: string;
  pageName?: string;
  itemNotFoundMessage?: string;
  store: RootStore;
  children: () => JSX.Element;
}

const DEV_ENVIRONMENT = true;

export default class PageErrorHandlingWrapper extends React.Component<PageErrorHandlingWrapperProps> {
  constructor(props: PageErrorHandlingWrapperProps) {
    super(props);

    this.agent = initializeAgent({
      url: `amixr-prod-path`,
      apiKey: 'PF1q69AewFaI',
      preventGlobalExposure: true,
      instrumentations: [new ErrorsInstrumentation()],
      app: {
        name: 'oncall',
        version: props.store.backendVersion,
      },
      metas: [
        ...defaultMetas,
        {
          session: {
            // new session id for every page load
            id: (Math.random() + 1).toString(36).substring(2),
          },
        },
      ],
    });
  }

  private agent: Agent

  componentDidUpdate() {
    const { errorData, itemNotFoundMessage } = this.props;

    // todo: check for changes on [errorData.isNotFoundError]
    const { isWrongTeamError, isNotFoundError } = errorData;
    if (!isWrongTeamError && isNotFoundError && itemNotFoundMessage) {
      openWarningNotification(itemNotFoundMessage);
    }
  }

  componentDidCatch(error) {
    this.agent.api.pushError(error);
  }

  render() {
    const { store, pageName, objectName, errorData, children } = this.props;

    if (!errorData.isWrongTeamError) {
      return children();
    }

    const currentTeamId = store.userStore.currentUser?.current_team;
    const currentTeam = store.grafanaTeamStore.items[currentTeamId]?.name;

    const { switchToTeam, wrongTeamNoPermissions } = errorData;

    const onTeamChange = async (teamId: GrafanaTeam['id']) => {
      await store.userStore.updateCurrentUser({ current_team: teamId });
      window.location.reload();
    };

    // @ts-ignore
    if (window.throwErrorNow) throw new Error('now');

    return (
      <div className={cx('not-found')}>
        <VerticalGroup spacing="lg" align="center">
          <Text.Title level={1} className={cx('error-code')}>
            403
          </Text.Title>
          {wrongTeamNoPermissions && (
            <Text.Title level={4}>
              This {objectName} belongs to a team you are not a part of. Please contact your organization administrator
              to request access to the team.
            </Text.Title>
          )}
          {switchToTeam && (
            <Text.Title level={4}>
              This {objectName} belongs to team {switchToTeam.name}. To see {objectName} details please change the team
              to {switchToTeam.name}.
            </Text.Title>
          )}
          {switchToTeam && (
            <Button onClick={() => onTeamChange(switchToTeam.id)} className={cx('change-team-button')}>
              <div className={cx('change-team-icon')}>
                <ChangeTeamIcon />
              </div>
              Change the team
            </Button>
          )}
          <Text type="secondary">
            Or return to the <PluginLink query={{ page: pageName }}>{objectName} list</PluginLink> for team{' '}
            {currentTeam}
          </Text>
        </VerticalGroup>
      </div>
    );
  }
}
