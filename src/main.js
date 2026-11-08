import { runIntro } from './intro.js';
import { createGame } from './game.js';
import { buildPanel } from './panel.js';

buildPanel();
runIntro(() => {
  document.querySelector('#app').hidden = false;
  window.__game = createGame();
});
