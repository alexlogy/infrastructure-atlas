import * as migration_20261121_125812_initial from './20261121_125812_initial';
import * as migration_20261121_135345_impact_projects_atlas_home from './20261121_135345_impact_projects_atlas_home';

export const migrations = [
  {
    up: migration_20261121_125812_initial.up,
    down: migration_20261121_125812_initial.down,
    name: '20261121_125812_initial',
  },
  {
    up: migration_20261121_135345_impact_projects_atlas_home.up,
    down: migration_20261121_135345_impact_projects_atlas_home.down,
    name: '20261121_135345_impact_projects_atlas_home'
  },
];
