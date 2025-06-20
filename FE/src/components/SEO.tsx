import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'sports_event';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Volleyball 4-2 - Official Roblox Volleyball League',
  description = 'Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events.',
  keywords = 'volleyball, roblox, RVL, volleyball league, volleyball 4-2, roblox volleyball, competitive volleyball, volleyball stats, volleyball teams, volleyball players',
  image = 'https://volleyball4-2.com/rvlLogo.png',
  url = 'https://volleyball4-2.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  structuredData
}) => {
  const fullTitle = title === 'Volleyball 4-2 - Official Roblox Volleyball League' 
    ? title 
    : `${title} | Volleyball 4-2`;

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Roblox Volleyball League",
    "alternateName": "RVL",
    "url": "https://volleyball4-2.com",
    "logo": "https://volleyball4-2.com/rvlLogo.png",
    "description": "Official Roblox Volleyball League - Competitive volleyball gaming community",
    "sport": "Volleyball",
    "foundingDate": "2023",
    "sameAs": [
      "https://discord.gg/volleyball",
      "https://www.roblox.com/games/3840352284/Volleyball-4-2"
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || "Roblox Volleyball League"} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Volleyball 4-2" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@volleyball4_2" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#2d3c50" />
      
      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags.length > 0 && (
        tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO; 