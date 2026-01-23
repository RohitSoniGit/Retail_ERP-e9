import { useEffect } from 'react';
import { useOrganization } from '@/lib/context/organization';

export function useDynamicBranding() {
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization) {
      // Update page title
      const title = `${organization.name || 'Ronak Jewellers'} | ERP Management System`;
      document.title = title;

      // Update favicon if available
      if (organization.favicon_url) {
        updateFavicon(organization.favicon_url);
      }

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Complete ERP solution for ${organization.name || 'Ronak Jewellers'} - Inventory, Sales, Purchase & Accounting`
        );
      }

      // Update Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${organization.name || 'Ronak Jewellers'} | Premium Business Management`);
      }

      // Update Open Graph description
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', 
          `Complete ERP solution for ${organization.name || 'Ronak Jewellers'} - Managing business operations efficiently`
        );
      }
    }
  }, [organization]);

  const updateFavicon = (faviconUrl: string) => {
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());

    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    // Add apple touch icon
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = faviconUrl;
    document.head.appendChild(appleLink);

    // Add different sizes
    const sizes = ['16x16', '32x32', '96x96'];
    sizes.forEach(size => {
      const sizedLink = document.createElement('link');
      sizedLink.rel = 'icon';
      sizedLink.type = 'image/png';
      sizedLink.sizes = size;
      sizedLink.href = faviconUrl;
      document.head.appendChild(sizedLink);
    });
  };
}