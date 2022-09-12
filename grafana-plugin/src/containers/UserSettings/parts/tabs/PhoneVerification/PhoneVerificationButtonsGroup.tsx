import React from 'react';
import { Button, HorizontalGroup } from '@grafana/ui';
import { WithPermissionControl } from 'containers/WithPermissionControl/WithPermissionControl';
import { User } from 'models/user/user.types';
import { UserAction } from 'state/userAction';

interface PhoneVerificationButtonsGroupProps {
  action: UserAction.UpdateOwnSettings | UserAction.UpdateOtherUsersSettings;

  isCodeSent: boolean;
  isVerificationButtonDisabled: boolean;
  isTestCallInProgress: boolean;
  isTwilioConfigured: boolean;
  isLoading: boolean;

  onSubmitCallback(): void;
  handleMakeTestCallClick(): void;
  onShowForgetScreen(): void;

  user: User;
}

function PhoneVerificationButtonsGroup({
  action,
  isCodeSent,
  isVerificationButtonDisabled,
  isTestCallInProgress,
  isTwilioConfigured,
  isLoading,
  onSubmitCallback,
  handleMakeTestCallClick,
  onShowForgetScreen,
  user,
}: PhoneVerificationButtonsGroupProps) {
  const showForgetNumber = !!user.verified_phone_number;
  const showVerifyOrSendCodeButton = !user.verified_phone_number;

  return (
    <HorizontalGroup>
      {showVerifyOrSendCodeButton && (
        <WithPermissionControl userAction={action}>
          <Button variant="primary" onClick={onSubmitCallback} disabled={isVerificationButtonDisabled || isLoading}>
            {isCodeSent ? 'Verify' : 'Send Code'}
          </Button>
        </WithPermissionControl>
      )}

      {showForgetNumber && (
        <WithPermissionControl userAction={action}>
          <Button
            disabled={
              (!user.verified_phone_number && !user.unverified_phone_number) || isTestCallInProgress || isLoading
            }
            onClick={onShowForgetScreen}
            variant="destructive"
          >
            {'Forget Phone Number'}
          </Button>
        </WithPermissionControl>
      )}

      {user.verified_phone_number && (
        <WithPermissionControl userAction={action}>
          <Button
            disabled={!user?.verified_phone_number || !isTwilioConfigured || isTestCallInProgress || isLoading}
            onClick={handleMakeTestCallClick}
          >
            {isTestCallInProgress ? 'Making Test Call...' : 'Make Test Call'}
          </Button>
        </WithPermissionControl>
      )}
    </HorizontalGroup>
  );
}

export default PhoneVerificationButtonsGroup;
