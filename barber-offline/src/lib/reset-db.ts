import Dexie from 'dexie';
import { db } from './db';

export async function resetDatabase() {
  // Cierra conexiones y elimina la DB local
  await db.close();
  await Dexie.delete('barber_offline'); // <-- el nombre que pusiste en db.ts
  // Recargá la app
  location.reload();
}