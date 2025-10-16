/**
 * Compresse une image en la redimensionnant si nécessaire
 * pour respecter la limite de taille de Vercel (4 MB)
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 4,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Impossible de compresser l\'image'));
              return;
            }
            
            // Créer un nouveau fichier à partir du blob
            const compressedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            
            // Vérifier si la compression a fonctionné
            if (compressedFile.size <= maxSizeMB * 1024 * 1024) {
              resolve(compressedFile);
            } else {
              // Si toujours trop gros, essayer avec une qualité inférieure
              if (quality > 0.5) {
                compressImage(file, maxSizeMB, maxWidth, maxHeight, quality - 0.1)
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error('Impossible de compresser l\'image en dessous de la limite'));
              }
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Impossible de lire le fichier'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Vérifie et compresse une image si nécessaire
 */
export async function prepareImageForUpload(file: File, maxSizeMB: number = 4): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Si l'image est déjà en dessous de la limite, la retourner telle quelle
  if (file.size <= maxSizeBytes) {
    return file;
  }
  
  console.log(`Image trop grande (${(file.size / 1024 / 1024).toFixed(2)} MB), compression en cours...`);
  
  // Sinon, la compresser
  return compressImage(file, maxSizeMB);
}
