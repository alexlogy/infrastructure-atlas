import * as migration_20261121_125812_initial from './20261121_125812_initial';

export const migrations = [
  {
    up: migration_20261121_125812_initial.up,
    down: migration_20261121_125812_initial.down,
    name: '20261121_125812_initial'
  },
];
