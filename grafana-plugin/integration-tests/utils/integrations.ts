import { Page } from '@playwright/test';
import { clickButton, fillInInput, selectDropdownValue } from './forms';
import { goToOnCallPageByClickingOnTab } from './navigation';

// TODO: update integration name...
export const createIntegrationAndSendDemoAlert = async (
  page: Page,
  integrationName: string,
  escalationChainName: string
): Promise<void> => {
  // go to the integrations page
  await goToOnCallPageByClickingOnTab(page, 'Integrations');

  // open the create integration modal
  (await page.waitForSelector('text=New integration for receiving alerts')).click();

  // create a webhook integration
  (await page.waitForSelector('div[class*="CreateAlertReceiveChannelContainer"] >> text=Webhook')).click();

  // wait for the integrations settings modal to open up... and then close it
  await page.waitForTimeout(2000);
  await clickButton({ page, buttonText: 'Open Escalations Settings' });

  // get the surrounding element for the integration settings
  const integrationSettingsElement = page.locator(
    'div[class*="components-Collapse-Collapse-module__root containers-AlertRules-AlertRules-module__route"]'
  );

  const integrationNameElement = integrationSettingsElement.locator(
    'h4[class*="components-Text-Text-module__title"] >> button'
  );
  await integrationNameElement.waitFor({ state: 'visible' });
  await integrationNameElement.click();

  await fillInInput(page, 'div[class="containers-AlertRules-AlertRules-module__root"] >> input', integrationName);
  await clickButton({ page, buttonText: 'Update' });

  // assign the escalation chain to the integration
  await selectDropdownValue({
    page,
    selectType: 'grafanaSelect',
    placeholderText: 'Select Escalation Chain',
    value: escalationChainName,
    startingLocator: integrationSettingsElement,
  });

  // send demo alert
  await clickButton({ page, buttonText: 'Send demo alert', startingLocator: integrationSettingsElement });
};
