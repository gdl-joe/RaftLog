-- RaftLog Datenbank-Schema
-- MySQL 8.0+ · utf8mb4_unicode_ci

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- Benutzer
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `handle`        VARCHAR(32) UNIQUE NOT NULL,
  `name`          VARCHAR(120) NOT NULL,
  `email`         VARCHAR(180) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('admin','viewer') NOT NULL DEFAULT 'viewer',
  `prefs`         JSON COMMENT '{"theme":"dark","layout":"cards"}',
  `invite_token`  VARCHAR(64) NULL,
  `invited_by`    INT NULL,
  `last_login`    DATETIME NULL,
  `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Flüsse
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rivers` (
  `id`               VARCHAR(64) PRIMARY KEY COMMENT 'URL-slug, z.B. aller-niedersachsen',
  `name`             VARCHAR(180) NOT NULL,
  `region`           VARCHAR(180),
  `country`          CHAR(2) COMMENT 'ISO 3166-1 alpha-2',
  `source_name`      VARCHAR(180),
  `source_lat`       DECIMAL(9,6),
  `source_lng`       DECIMAL(9,6),
  `mouth_name`       VARCHAR(180),
  `mouth_lat`        DECIMAL(9,6),
  `mouth_lng`        DECIMAL(9,6),
  `length_km`        DECIMAL(7,2),
  `ww_grade_typical` VARCHAR(16) COMMENT 'WW I–II, WW III–IV',
  `notes`            TEXT,
  `created_by`       INT NOT NULL,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX (`country`),
  INDEX (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Seen
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lakes` (
  `id`          VARCHAR(64) PRIMARY KEY,
  `name`        VARCHAR(180) NOT NULL,
  `region`      VARCHAR(180),
  `country`     CHAR(2),
  `lat`         DECIMAL(9,6),
  `lng`         DECIMAL(9,6),
  `area_km2`    DECIMAL(8,2),
  `depth_max_m` INT UNSIGNED,
  `notes`       TEXT,
  `created_by`  INT NOT NULL,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX (`country`),
  INDEX (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Höhlen
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `caves` (
  `id`               VARCHAR(64) PRIMARY KEY,
  `name`             VARCHAR(180) NOT NULL,
  `region`           VARCHAR(180),
  `country`          CHAR(2),
  `lat`              DECIMAL(9,6),
  `lng`              DECIMAL(9,6),
  `depth_m`          INT UNSIGNED,
  `length_m`         INT UNSIGNED,
  `type`             ENUM('Horizontal','Vertikal','Mixed','Labyrinth'),
  `discovered_year`  SMALLINT UNSIGNED,
  `notes`            TEXT,
  `created_by`       INT NOT NULL,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX (`country`),
  INDEX (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Portage-Strecken
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `portages` (
  `id`               VARCHAR(64) PRIMARY KEY,
  `name`             VARCHAR(180) NOT NULL,
  `region`           VARCHAR(180),
  `country`          CHAR(2),
  `start_lat`        DECIMAL(9,6),
  `start_lng`        DECIMAL(9,6),
  `end_lat`          DECIMAL(9,6),
  `end_lng`          DECIMAL(9,6),
  `distance_m`       INT UNSIGNED,
  `elevation_gain_m` INT UNSIGNED,
  `notes`            TEXT,
  `created_by`       INT NOT NULL,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Befahrungen (Trips)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trips` (
  `id`             VARCHAR(64) PRIMARY KEY,
  `trip_type`      ENUM('river','lake','cave','portage') NOT NULL,
  `water_id`       VARCHAR(64) NOT NULL COMMENT 'FK je nach trip_type (App-seitig validiert)',
  `title`          VARCHAR(240) NOT NULL,
  `date_from`      DATE NOT NULL,
  `date_to`        DATE NULL COMMENT 'NULL = Eintages-Trip',
  `start_time`     TIME,
  `end_time`       TIME,
  `duration_min`   INT UNSIGNED,

  -- Einheitlich: Schwierigkeit T/K/P + Rating
  `diff_t`         TINYINT UNSIGNED,
  `diff_k`         TINYINT UNSIGNED,
  `diff_p`         TINYINT UNSIGNED,
  `rating`         TINYINT UNSIGNED,

  -- Allgemein
  `distance_km`    DECIMAL(6,2),
  `weather`        VARCHAR(240),
  `notes`          TEXT,

  -- Typ-spezifisch — river:
  `ww_grade`       VARCHAR(16),
  `water_level`    VARCHAR(80),
  `put_in_lat`     DECIMAL(9,6),
  `put_in_lng`     DECIMAL(9,6),
  `take_out_lat`   DECIMAL(9,6),
  `take_out_lng`   DECIMAL(9,6),

  -- Typ-spezifisch — lake:
  `wind_beaufort`  TINYINT UNSIGNED,
  `waves`          VARCHAR(80),

  -- Typ-spezifisch — cave:
  `wet`            ENUM('Trocken','Teilweise','Nass'),
  `rope`           ENUM('Ohne','Mit Seil','SRT'),

  -- Typ-spezifisch — portage:
  `portage_distance_m` INT UNSIGNED,
  `carry_method`       VARCHAR(80),

  `hero_icon`      ENUM('river','lake','cave','portage','mixed') DEFAULT 'river',
  `cover_photo_id` INT NULL COMMENT 'Optional: gewähltes Titelbild (sonst erstes Foto)',
  `is_public`      TINYINT(1) NOT NULL DEFAULT 0,
  `created_by`     INT NOT NULL,
  `created_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX (`date_from`),
  INDEX (`trip_type`),
  INDEX (`water_id`),
  INDEX (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Team-Mitglieder pro Befahrung
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trip_team` (
  `trip_id`        VARCHAR(64) NOT NULL,
  `member_name`    VARCHAR(120) NOT NULL,
  `member_user_id` INT NULL,
  PRIMARY KEY (`trip_id`, `member_name`),
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Ausrüstung pro Befahrung
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trip_gear` (
  `trip_id` VARCHAR(64) NOT NULL,
  `gear`    VARCHAR(120) NOT NULL,
  PRIMARY KEY (`trip_id`, `gear`),
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Gefahren pro Befahrung
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trip_hazards` (
  `trip_id` VARCHAR(64) NOT NULL,
  `hazard`  VARCHAR(240) NOT NULL,
  PRIMARY KEY (`trip_id`, `hazard`(191)),
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- GPS-Tracks (GPX-Import oder Live-Tracking)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trip_tracks` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `trip_id`     VARCHAR(64) NOT NULL,
  `source`      ENUM('gpx_import','live') NOT NULL,
  `gpx_path`    VARCHAR(500),
  `points_json` LONGTEXT COMMENT 'Vereinfachte Punktliste [{lat,lng,t,ele}]',
  `point_count` INT UNSIGNED,
  `distance_km` DECIMAL(6,2),
  `duration_s`  INT UNSIGNED,
  `ele_gain_m`  INT,
  `bbox_n`      DECIMAL(9,6),
  `bbox_s`      DECIMAL(9,6),
  `bbox_e`      DECIMAL(9,6),
  `bbox_w`      DECIMAL(9,6),
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
  INDEX (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Fotos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `photos` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `trip_id`     VARCHAR(64) NOT NULL,
  `path`        VARCHAR(500) NOT NULL,
  `thumb_path`  VARCHAR(500),
  `large_path`  VARCHAR(500),
  `caption`     TEXT,
  `taken_at`    DATETIME,
  `gps_lat`     DECIMAL(9,6),
  `gps_lng`     DECIMAL(9,6),
  `width`       INT UNSIGNED,
  `height`      INT UNSIGNED,
  `sort_order`  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
  INDEX (`trip_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
