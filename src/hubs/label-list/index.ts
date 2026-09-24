// Hub bootstrap: SDK handshake + mount the App shell — the single registered hub (label-list is the entry point).
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { initializeSdk, notifyLoaded } from '../../services/sdkInit';
import { App } from './App';

async function main(): Promise<void> {
  await initializeSdk();

  const container = document.getElementById('root');
  ReactDOM.render(React.createElement(App), container);

  //await notifyLoaded();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize the TFVC Labels hub', error);
});
