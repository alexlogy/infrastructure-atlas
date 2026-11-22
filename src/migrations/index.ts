import * as migration_20261121_125812_initial from './20261121_125812_initial';
import * as migration_20261121_135345_impact_projects_atlas_home from './20261121_135345_impact_projects_atlas_home';
import * as migration_20261121_144219_atlas_settings from './20261121_144219_atlas_settings';
import * as migration_20261121_151739_writing_settings from './20261121_151739_writing_settings';
import * as migration_20261121_152635_site_share_image from './20261121_152635_site_share_image';
import * as migration_20261122_040725_site_contact from './20261122_040725_site_contact';
import * as migration_20261122_042656_project_category_icon from './20261122_042656_project_category_icon';
import * as migration_20261122_043453_achievements_home_hero from './20261122_043453_achievements_home_hero';
import * as migration_20261122_044715_about_page from './20261122_044715_about_page';
import * as migration_20261122_045549_lab_projects from './20261122_045549_lab_projects';

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
    name: '20261121_152635_site_share_image',
  },
  {
    up: migration_20261122_040725_site_contact.up,
    down: migration_20261122_040725_site_contact.down,
    name: '20261122_040725_site_contact',
  },
  {
    up: migration_20261122_042656_project_category_icon.up,
    down: migration_20261122_042656_project_category_icon.down,
    name: '20261122_042656_project_category_icon',
  },
  {
    up: migration_20261122_043453_achievements_home_hero.up,
    down: migration_20261122_043453_achievements_home_hero.down,
    name: '20261122_043453_achievements_home_hero',
  },
  {
    up: migration_20261122_044715_about_page.up,
    down: migration_20261122_044715_about_page.down,
    name: '20261122_044715_about_page',
  },
  {
    up: migration_20261122_045549_lab_projects.up,
    down: migration_20261122_045549_lab_projects.down,
    name: '20261122_045549_lab_projects'
  },
];
