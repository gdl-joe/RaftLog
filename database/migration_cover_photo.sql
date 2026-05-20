-- Migration: Titelfoto pro Trip wählbar machen
-- Auf bestehender DB ausführen (z.B. via phpMyAdmin)

ALTER TABLE `trips`
  ADD COLUMN `cover_photo_id` INT NULL AFTER `hero_icon`,
  ADD INDEX `idx_cover_photo` (`cover_photo_id`);
