const fetch = require('node-fetch');

// Base URL for your site
const BASE_URL = 'https://volleyball4-2.com';
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Function to fetch data from your API
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Function to generate article meta tags
function generateArticleMetaTags(article) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} | Volleyball 4-2</title>
    
    <!-- SEO Meta Tags for Social Media Embedding -->
    <meta name="description" content="${article.summary}" />
    <meta name="keywords" content="volleyball, roblox, RVL, volleyball league, volleyball 4-2, roblox volleyball, competitive volleyball, volleyball stats, volleyball teams, volleyball players" />
    <meta name="author" content="${article.author?.username || 'Roblox Volleyball League'}" />
    
    <!-- Open Graph Meta Tags (Works with Instagram, Discord, Facebook, LinkedIn, etc.) -->
    <meta property="og:title" content="${article.title} | Volleyball 4-2" />
    <meta property="og:description" content="${article.summary}" />
    <meta property="og:image" content="${article.imageUrl || 'https://volleyball4-2.com/rvlLogo.png'}" />
    <meta property="og:url" content="${BASE_URL}/articles/${article.id}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Volleyball 4-2" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Instagram & Discord optimizations -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${article.title}" />
    <meta property="og:image:secure_url" content="${(article.imageUrl || 'https://volleyball4-2.com/rvlLogo.png').replace('http://', 'https://')}" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${article.title} | Volleyball 4-2" />
    <meta name="twitter:description" content="${article.summary}" />
    <meta name="twitter:image" content="${article.imageUrl || 'https://volleyball4-2.com/rvlLogo.png'}" />
    <meta name="twitter:site" content="@volleyball4_2" />
    <meta name="twitter:image:alt" content="${article.title}" />
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#2d3c50" />
    
    <!-- Article specific meta tags -->
    <meta property="article:published_time" content="${new Date(article.createdAt).toISOString()}" />
    <meta property="article:author" content="${article.author?.username || 'Roblox Volleyball League'}" />
    <meta property="article:section" content="News" />
    <meta property="article:tag" content="volleyball" />
    <meta property="article:tag" content="roblox" />
    <meta property="article:tag" content="RVL" />
    <meta property="article:tag" content="gaming" />
    <meta property="article:tag" content="sports" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${BASE_URL}/articles/${article.id}" />
    
    <!-- Redirect to the actual React app -->
    <meta http-equiv="refresh" content="0;url=${BASE_URL}/articles/${article.id}" />
    
    <!-- Fallback for non-JS users -->
    <script>
        window.location.href = '${BASE_URL}/articles/${article.id}';
    </script>
</head>
<body>
    <p>Redirecting to <a href="${BASE_URL}/articles/${article.id}">${article.title}</a>...</p>
</body>
</html>`;
}

// Function to generate player meta tags
function generatePlayerMetaTags(player) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${player.name} - Player Profile | Volleyball 4-2</title>
    
    <!-- SEO Meta Tags for Social Media Embedding -->
    <meta name="description" content="${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights." />
    <meta name="keywords" content="volleyball, roblox, RVL, volleyball league, volleyball 4-2, roblox volleyball, competitive volleyball, volleyball stats, volleyball teams, volleyball players" />
    <meta name="author" content="Roblox Volleyball League" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${player.name} - Player Profile | Volleyball 4-2" />
    <meta property="og:description" content="${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights." />
    <meta property="og:image" content="https://volleyball4-2.com/rvlLogo.png" />
    <meta property="og:url" content="${BASE_URL}/players/${player.id}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="Volleyball 4-2" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Instagram & Discord optimizations -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${player.name} - Player Profile" />
    <meta property="og:image:secure_url" content="https://volleyball4-2.com/rvlLogo.png" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${player.name} - Player Profile | Volleyball 4-2" />
    <meta name="twitter:description" content="${player.name} is a ${player.position} in the Roblox Volleyball League. View stats, teams, awards, and career highlights." />
    <meta name="twitter:image" content="https://volleyball4-2.com/rvlLogo.png" />
    <meta name="twitter:site" content="@volleyball4_2" />
    <meta name="twitter:image:alt" content="${player.name} - Player Profile" />
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#2d3c50" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${BASE_URL}/players/${player.id}" />
    
    <!-- Redirect to the actual React app -->
    <meta http-equiv="refresh" content="0;url=${BASE_URL}/players/${player.id}" />
    
    <!-- Fallback for non-JS users -->
    <script>
        window.location.href = '${BASE_URL}/players/${player.id}';
    </script>
</head>
<body>
    <p>Redirecting to <a href="${BASE_URL}/players/${player.id}">${player.name} - Player Profile</a>...</p>
</body>
</html>`;
}

// Main handler function
exports.handler = async (event, context) => {
  // Check if this is a social media crawler
  const userAgent = event.headers['user-agent'] || '';
  const isSocialMediaCrawler = 
    userAgent.includes('facebookexternalhit') ||
    userAgent.includes('Twitterbot') ||
    userAgent.includes('Discordbot') ||
    userAgent.includes('WhatsApp') ||
    userAgent.includes('TelegramBot') ||
    userAgent.includes('Slackbot') ||
    userAgent.includes('LinkedInBot') ||
    userAgent.includes('Instagram') ||
    userAgent.includes('Pinterest') ||
    userAgent.includes('Snapchat');

  // If not a social media crawler, redirect to the main app
  if (!isSocialMediaCrawler) {
    return {
      statusCode: 302,
      headers: {
        'Location': `${BASE_URL}${event.path}`,
        'Cache-Control': 'no-cache'
      }
    };
  }

  try {
    const path = event.path;
    
    // Handle article routes
    if (path.startsWith('/articles/')) {
      const articleId = path.split('/articles/')[1];
      const articles = await fetchData(`articles/${articleId}`);
      
      if (articles && Array.isArray(articles) && articles.length > 0) {
        const article = articles[0];
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
          },
          body: generateArticleMetaTags(article)
        };
      }
    }
    
    // Handle player routes
    if (path.startsWith('/players/')) {
      const playerId = path.split('/players/')[1];
      const player = await fetchData(`players/${playerId}`);
      
      if (player) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
          },
          body: generatePlayerMetaTags(player)
        };
      }
    }
    
    // Default: redirect to main app
    return {
      statusCode: 302,
      headers: {
        'Location': `${BASE_URL}${path}`,
        'Cache-Control': 'no-cache'
      }
    };
    
  } catch (error) {
    console.error('Error in meta-tags function:', error);
    
    // On error, redirect to main app
    return {
      statusCode: 302,
      headers: {
        'Location': `${BASE_URL}${event.path}`,
        'Cache-Control': 'no-cache'
      }
    };
  }
}; 