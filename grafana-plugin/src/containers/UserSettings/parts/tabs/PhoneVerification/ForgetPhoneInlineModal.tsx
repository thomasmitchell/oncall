import { Button, HorizontalGroup } from '@grafana/ui';
import cn from 'classnames/bind';
import Text from 'components/Text/Text';
import React from 'react';

import styles from './PhoneVerification.module.css';

const cx = cn.bind(styles);

interface ForgetPhoneInlineModalProps {
  phone: string;
  isLoading: boolean;
  onCancel(): void;
  onForget(): void;
}

function ForgetPhoneInlineModal({ phone, onCancel, onForget, isLoading }: ForgetPhoneInlineModalProps) {
  return (
    <>
      <Text size="large" className={cx('phone__forgetHeading')}>
        Do you really want to forget the verified phone number <strong>{phone}</strong> ?
      </Text>
      <HorizontalGroup justify="flex-end">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onForget} disabled={isLoading}>
          Forget
        </Button>
      </HorizontalGroup>
    </>
  );
}

export default ForgetPhoneInlineModal;
