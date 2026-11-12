export const site = {
  name: import.meta.env.VITE_SITE_NAME || 'TechPulse',
  tagline: 'Technology insights, tutorials and company news',
  description: 'Articles on software development, AI, cloud, cybersecurity and industry trends.',
  url: (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, ''),
  // Replace these with your real company details
  company: {
    legalName: 'TechPulse Solutions Pvt. Ltd.',
    address: '12 Innovation Park, Guindy, Chennai, Tamil Nadu 600032, India',
    email: 'hello@example.com',
    phone: '+91 44 0000 0000',
  },
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'X', href: 'https://x.com/' },
    { label: 'YouTube', href: 'https://www.youtube.com/' },
    { label: 'GitHub', href: 'https://github.com/' },
  ],
};
