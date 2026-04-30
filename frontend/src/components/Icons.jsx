const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </>
  ),
  campaigns: (
    <>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
    </>
  ),
  tiktok: (
    <>
      <path d="M9 18V6h5.5a3.5 3.5 0 0 0 3.5 3.5V14a8.5 8.5 0 0 1-5.5-2v6"/>
      <circle cx="6.5" cy="18" r="2.5"/>
    </>
  ),
  videos: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="m10 9 5 3-5 3V9z" fill="currentColor" stroke="none"/>
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </>
  ),
  agents: (
    <>
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12" strokeWidth="3" strokeLinecap="round"/>
      <path d="M8 12h.01M16 12h.01M12 16h.01"/>
    </>
  ),
  audit: (
    <>
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </>
  ),
  financials: (
    <>
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </>
  ),
  crown: (
    <>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6"/>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </>
  ),
};

export function Icon({ name, size = 16, className = '', strokeWidth = 1.75 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
