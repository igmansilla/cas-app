import { type ReactNode, useEffect, useState } from 'react';
import { fetchWithAuth } from '../../oidc';

interface ProtectedEquipoImageProps {
  url: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function ProtectedEquipoImage({
  url,
  alt,
  className,
  fallback = <p className="text-sm text-gray-500">No se pudo cargar la imagen</p>,
  loadingFallback = <p className="text-sm text-gray-500">Cargando imagen...</p>,
}: ProtectedEquipoImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;

    setLoading(true);
    setHasError(false);

    fetchWithAuth(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.blob();
      })
      .then((blob) => {
        if (!active) {
          return;
        }

        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error('Error al cargar imagen protegida:', error);
        setHasError(true);
        setObjectUrl(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [url]);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (hasError || !objectUrl) {
    return <>{fallback}</>;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}