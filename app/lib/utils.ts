export function generateSlug(title: string): string {
  return title
    .toLowerCase() // Küçük harfe çevir
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '') // Sadece harfleri, rakamları ve boşlukları tut
    .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
    .replace(/-+/g, '-') // Birden fazla tireyi tek tireye indir
    .replace(/^-+/, '') // Baştaki tireleri kaldır
    .replace(/-+$/, ''); // Sondaki tireleri kaldır
} 