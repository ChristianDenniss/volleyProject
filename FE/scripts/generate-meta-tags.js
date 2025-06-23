const fs = require('fs');
const path = require('path');

// Base URL for your site
const BASE_URL = 'https://volleyball4-2.com';

// Function to generate meta tags for an article
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

// Function to generate meta tags for a player
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

// Function to fetch data from your API
async function fetchData(endpoint) {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${backendUrl}/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Main function to generate all meta tag files
async function generateMetaTagFiles() {
  console.log('Generating meta tag files for social media crawlers...');
  
  // Create the meta-tags directory if it doesn't exist
  const metaTagsDir = path.join(__dirname, '../public/meta-tags');
  if (!fs.existsSync(metaTagsDir)) {
    fs.mkdirSync(metaTagsDir, { recursive: true });
  }
  
  // Fetch articles
  const articles = await fetchData('articles');
  if (articles && Array.isArray(articles)) {
    console.log(`Generating meta tags for ${articles.length} articles...`);
    articles.forEach(article => {
      const html = generateArticleMetaTags(article);
      const filePath = path.join(metaTagsDir, `article-${article.id}.html`);
      fs.writeFileSync(filePath, html);
      console.log(`Generated: article-${article.id}.html`);
    });
  }
  
  // Fetch players
  const players = await fetchData('players');
  if (players && Array.isArray(players)) {
    console.log(`Generating meta tags for ${players.length} players...`);
    players.forEach(player => {
      const html = generatePlayerMetaTags(player);
      const filePath = path.join(metaTagsDir, `player-${player.id}.html`);
      fs.writeFileSync(filePath, html);
      console.log(`Generated: player-${player.id}.html`);
    });
  }
  
  console.log('Meta tag generation complete!');
}

// Run the script
if (require.main === module) {
  generateMetaTagFiles().catch(console.error);
}

module.exports = { generateMetaTagFiles, generateArticleMetaTags, generatePlayerMetaTags }; 