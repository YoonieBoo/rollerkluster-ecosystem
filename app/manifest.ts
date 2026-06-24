import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RollerKluster Creator Ecosystem',
    short_name: 'RollerKluster',
    description: 'Creator campaign invites, submissions, and performance tracking.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#bf6be8',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/logo%20pic.PNG',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
