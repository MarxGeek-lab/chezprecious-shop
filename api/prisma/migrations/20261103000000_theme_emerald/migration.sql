-- Couleurs du thème ChezPrecious : vert émeraude profond #0F5C4A, texte anthracite, fond clair
ALTER TABLE "site_settings" ALTER COLUMN "primary_color" SET DEFAULT '#0F5C4A',
ALTER COLUMN "secondary_color" SET DEFAULT '#1F2933',
ALTER COLUMN "accent_color" SET DEFAULT '#FAFAF7';

-- Réglages existants encore aux couleurs du thème rouge précédent
UPDATE "site_settings"
SET "primary_color" = '#0F5C4A', "secondary_color" = '#1F2933', "accent_color" = '#FAFAF7'
WHERE "primary_color" = '#FF2C2C';
