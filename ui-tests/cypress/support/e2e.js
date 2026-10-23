// Loaded before every spec file. Shared setup and custom commands go here.
import 'cypress-axe';
const { addCompareSnapshotCommand } = require('cypress-visual-regression/dist/command');

addCompareSnapshotCommand();
