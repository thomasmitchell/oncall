import React, { HTMLAttributes, useCallback, useRef, useReducer } from 'react';

import { Alert, Field, Icon, Input, Switch, VerticalGroup } from '@grafana/ui';
import cn from 'classnames/bind';
import { observer } from 'mobx-react';

import PluginLink from 'components/PluginLink/PluginLink';
import { WithPermissionControl } from 'containers/WithPermissionControl/WithPermissionControl';
import { User } from 'models/user/user.types';
import { AppFeature } from 'state/features';
import { useStore } from 'state/useStore';
import { UserAction } from 'state/userAction';
import { openErrorNotification } from 'utils';

import styles from './PhoneVerification.module.css';
import PhoneVerificationButtonsGroup from './PhoneVerificationButtonsGroup';
import ForgetPhoneInlineModal from './ForgetPhoneInlineModal';

const cx = cn.bind(styles);

interface PhoneVerificationProps extends HTMLAttributes<HTMLElement> {
  userPk?: User['pk'];
}

interface PhoneVerificationState {
  phone: string;
  code: string;
  isCodeSent: boolean;
  isPhoneNumberHidden: boolean;
  isLoading: boolean;
  showForgetScreen: boolean;
}

const PHONE_REGEX = /^\+\d{8,15}$/;

const PhoneVerification = observer((props: PhoneVerificationProps) => {
  const { userPk: propsUserPk } = props;

  const store = useStore();
  const { userStore, teamStore } = store;

  const userPk = (propsUserPk || userStore.currentUserPk) as User['pk'];
  let user = userStore.items[userPk];

  const [{ showForgetScreen, phone, code, isCodeSent, isPhoneNumberHidden, isLoading }, setState] = useReducer(
    (state: PhoneVerificationState, newState: Partial<PhoneVerificationState>) => ({
      ...state,
      ...newState,
    }),
    {
      code: '',
      phone: user.verified_phone_number || '+',
      isLoading: false,
      isCodeSent: false,
      showForgetScreen: false,
      isPhoneNumberHidden: user.hide_phone_number,
    }
  );

  const codeInputRef = useRef<any>();

  const onTogglePhoneCallback = useCallback(
    async ({ currentTarget: { checked: isPhoneNumberHidden } }: React.ChangeEvent<HTMLInputElement>) => {
      setState({ isPhoneNumberHidden, isLoading: true });

      await userStore.updateUser({ pk: userPk, hide_phone_number: isPhoneNumberHidden });
      user = userStore.items[userPk];

      setState({ phone: user.verified_phone_number, isLoading: false });
    },
    []
  );

  const onChangePhoneCallback = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ isCodeSent: false, phone: event.target.value });
  }, []);

  const onChangeCodeCallback = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ code: event.target.value });
  }, []);

  const handleMakeTestCallClick = useCallback(async () => {
    setState({ isLoading: true });
    await userStore.makeTestCall(userPk);
    setState({ isLoading: false });
  }, [userPk]);

  const handleForgetNumberClick = useCallback(() => {
    setState({ isLoading: true });
    userStore.forgetPhone(userPk).then(async () => {
      await userStore.loadUser(userPk);
      setState({ phone: '', showForgetScreen: false, isCodeSent: false, isLoading: false });
    });
  }, [userPk]);

  const { isTestCallInProgress } = userStore;

  const onSubmitCallback = useCallback(async () => {
    setState({ isLoading: true });

    if (isCodeSent) {
      await userStore
        .verifyPhone(userPk, code)
        .then(() => {
          userStore.loadUser(userPk);
        })
        .catch((error) => {
          openErrorNotification(error.response.data);
        })
        .finally(() => setState({ isLoading: false }));
    } else {
      await userStore.updateUser({
        pk: userPk,
        email: user.email,
        unverified_phone_number: phone,
      });

      userStore
        .fetchVerificationCode(userPk)
        .then(() => {
          setState({ isCodeSent: true });

          if (codeInputRef.current) {
            codeInputRef.current.focus();
          }
        })
        .catch(() => {
          openErrorNotification(
            "Can't send SMS code. Please try other phone number formats. Don't forget the country code!"
          );
        })
        .finally(() => setState({ isLoading: false }));
    }
  }, [code, isCodeSent, phone, store, user.email, userPk, userStore]);

  const isTwilioConfigured = teamStore.currentTeam?.env_status.twilio_configured;
  const phoneHasMinimumLength = phone?.length > 8;

  const isPhoneValid = phoneHasMinimumLength && PHONE_REGEX.test(phone);
  const showPhoneInputError = phoneHasMinimumLength && !isPhoneValid && !isPhoneNumberHidden && !isLoading;

  const isCurrent = userStore.currentUserPk === user.pk;
  const action = isCurrent ? UserAction.UpdateOwnSettings : UserAction.UpdateOtherUsersSettings;
  const isVerificationButtonDisabled =
    phone === user.verified_phone_number || (!isCodeSent && !isPhoneValid) || !isTwilioConfigured;

  const isPhoneDisabled = !!user.verified_phone_number;
  const isCodeFieldDisabled = !isCodeSent || !store.isUserActionAllowed(action);
  const showToggle = user.verified_phone_number && user.pk === userStore.currentUserPk;

  if (showForgetScreen) {
    return (
      <ForgetPhoneInlineModal
        phone={phone}
        isLoading={isLoading}
        onCancel={() => setState({ showForgetScreen: false })}
        onForget={handleForgetNumberClick}
      />
    );
  }

  return (
    <>
      {isPhoneValid && !user.verified_phone_number && (
        <>
          <Alert severity="info" title="You will receive alerts to a new number after verification" />
          <br />
        </>
      )}

      {!isTwilioConfigured && store.hasFeature(AppFeature.LiveSettings) && (
        <>
          <Alert
            severity="warning"
            // @ts-ignore
            title={
              <>
                Can't verify phone. <PluginLink query={{ page: 'live-settings' }}> Check ENV variables</PluginLink>{' '}
                related to Twilio.
              </>
            }
          />
          <br />
        </>
      )}

      <VerticalGroup>
        <Field
          className={cx('phone__field')}
          invalid={showPhoneInputError}
          error={showPhoneInputError ? 'Enter a valid phone number' : null}
        >
          <WithPermissionControl userAction={action}>
            <Input
              autoFocus
              id="phone"
              required
              disabled={!isTwilioConfigured || isPhoneDisabled}
              placeholder="Please enter the phone number with country code, e.g. +12451111111"
              // @ts-ignore
              prefix={<Icon name="phone" />}
              value={phone}
              onChange={onChangePhoneCallback}
            />
          </WithPermissionControl>
        </Field>

        {!user.verified_phone_number && (
          <Input
            ref={codeInputRef}
            disabled={isCodeFieldDisabled}
            autoFocus={isCodeSent}
            onChange={onChangeCodeCallback}
            placeholder="Please enter the code"
            className={cx('phone__field')}
          />
        )}

        {showToggle && (
          <div className={cx('switch')}>
            <div className={cx('switch__icon')}>
              <Switch value={isPhoneNumberHidden} onChange={onTogglePhoneCallback} />
            </div>
            <label className={cx('switch__label')}>Hide my phone number from teammates</label>
          </div>
        )}
      </VerticalGroup>

      <br />

      <PhoneVerificationButtonsGroup
        action={action}
        isCodeSent={isCodeSent}
        isVerificationButtonDisabled={isVerificationButtonDisabled}
        isTestCallInProgress={isTestCallInProgress}
        isTwilioConfigured={isTwilioConfigured}
        isLoading={isLoading}
        onSubmitCallback={onSubmitCallback}
        handleMakeTestCallClick={handleMakeTestCallClick}
        onShowForgetScreen={() => setState({ showForgetScreen: true })}
        user={user}
      />
    </>
  );
});

export default PhoneVerification;
