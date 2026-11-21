import * as migration_20261121_125812_initial from './20261121_125812_initial';
import * as migration_20261121_135345_impact_projects_atlas_home from './20261121_135345_impact_projects_atlas_home';
import * as migration_20261121_144219_atlas_settings from './20261121_144219_atlas_settings';
import * as migration_20261121_151739_writing_settings from './20261121_151739_writing_settings';
import * as migration_20261121_152635_site_share_image from './20261121_152635_site_share_image';

export const migrations = [
  {
    up: migration_20261121_125812_initial.up,
    down: migration_20261121_125812_initial.down,
    name: '20261121_125812_initial',
  },
  {
    up: migration_20261121_135345_impact_projects_atlas_home.up,
    down: migration_20261121_135345_impact_projects_atlas_home.down,
    name: '20261121_135345_impact_projects_atlas_home',
  },
  {
    up: migration_20261121_144219_atlas_settings.up,
    down: migration_20261121_144219_atlas_settings.down,
    name: '20261121_144219_atlas_settings',
  },
  {
    up: migration_20261121_151739_writing_settings.up,
    down: migration_20261121_151739_writing_settings.down,
    name: '20261121_151739_writing_settings',
  },
  {
    up: migration_20261121_152635_site_share_image.up,
    down: migration_20261121_152635_site_share_image.down,
    name: '20261121_152635_site_share_image'
  },
];
