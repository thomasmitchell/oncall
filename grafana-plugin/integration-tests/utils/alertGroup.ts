import { Page } from '@playwright/test';

export const alertGroupIsTriggered = async (page: Page): Promise<boolean> => {
  return Promise.resolve(true);
};

export const resolveAlertGroup = async (page: Page): Promise<void> => {};
