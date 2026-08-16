import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Janata Bank LHN Duty Management Portal',
    short_name: 'JB LHN Portal',
    description: 'Janata Bank PLC Late Sitting, Holiday & Night Duty Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b5e9e',
    orientation: 'portrait',
    icons: [
      {
        src: '/janata-bank-logo-real.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
