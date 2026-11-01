-- Couleurs du thème ChezPrecious (rouge #FF2C2C, texte sombre, fond clair)
ALTER TABLE "site_settings" ALTER COLUMN "primary_color" SET DEFAULT '#FF2C2C',
ALTER COLUMN "secondary_color" SET DEFAULT '#1F1416',
ALTER COLUMN "accent_color" SET DEFAULT '#FFFAF7';

-- Réglages existants encore aux couleurs de l'ancienne boutique
UPDATE "site_settings"
SET "primary_color" = '#FF2C2C', "secondary_color" = '#1F1416', "accent_color" = '#FFFAF7'
WHERE "primary_color" = '#C8A24A';
