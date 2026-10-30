/**
 * Après chaque build, remplace build/public/uploads par un symlink
 * vers le dossier persistant ../uploads (hors du build).
 *
 * Structure sur le serveur :
 *   /var/www/chezprecious/uploads/          ← dossier persistant (jamais écrasé)
 *   /var/www/chezprecious/api/build/public/uploads → symlink vers ../../uploads
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Dossier persistant : un niveau au-dessus de api/
const persistentUploads = path.resolve(root, '..', 'uploads')

// Cible dans le build
const buildUploads = path.join(root, 'build', 'public', 'uploads')

// S'assurer que le dossier persistant existe
fs.mkdirSync(persistentUploads, { recursive: true })

// Supprimer ce qui existe déjà dans build/public/uploads
if (fs.existsSync(buildUploads)) {
  fs.rmSync(buildUploads, { recursive: true, force: true })
}

// Créer le symlink relatif
const relative = path.relative(path.dirname(buildUploads), persistentUploads)
fs.symlinkSync(relative, buildUploads)

console.log(`[link-uploads] ${buildUploads} → ${persistentUploads}`)
