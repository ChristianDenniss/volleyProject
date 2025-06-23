# Social Media Meta Tags Setup Guide

This guide explains how to set up dynamic meta tags for social media crawlers (Discord, Facebook, Instagram, Twitter, etc.) so that when you share links like `volleyball4-2.com/articles/32`, they show rich previews instead of default details.

## Problem

Social media crawlers (Discord, Facebook, Instagram, etc.) don't execute JavaScript, so they can't see the dynamic meta tags set by React components. They only see the static HTML meta tags in the `<head>` section.

## Solution

We've implemented a **Netlify Function** that:
1. Detects social media crawlers by their User-Agent
2. Fetches the actual data from your API
3. Generates HTML with proper meta tags
4. Returns the HTML to the crawler
5. Redirects regular users to the React app

## Files Created

1. **`netlify/functions/meta-tags.js`** - Netlify function that generates meta tags
2. **`netlify.toml`** - Netlify configuration for routing
3. **`scripts/generate-meta-tags.js`** - Script to generate static meta tag files
4. **`SOCIAL_MEDIA_SETUP.md`** - This guide

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Make sure your backend URL is set in your Netlify environment variables:
- `VITE_BACKEND_URL` - Your backend API URL (e.g., `https://your-backend.com`)

### 3. Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 4. Environment Variables in Netlify

In your Netlify dashboard, go to Site settings > Environment variables and add:
- `VITE_BACKEND_URL` = `https://your-backend.com`

## How It Works

### For Social Media Crawlers

1. **Discord/Facebook/Instagram** visits `volleyball4-2.com/articles/32`
2. **Netlify** detects the User-Agent and routes to the function
3. **Function** fetches article data from your API
4. **Function** generates HTML with proper meta tags
5. **Crawler** sees rich preview with title, description, and image

### For Regular Users

1. **User** visits `volleyball4-2.com/articles/32`
2. **Netlify** routes to the React app
3. **React** loads and displays the full page

## Testing

### 1. Test with Discord

1. Share a link like `volleyball4-2.com/articles/32` in Discord
2. You should see a rich preview with:
   - Article title
   - Article description
   - Featured image
   - Website branding

### 2. Test with Facebook

1. Use Facebook's Sharing Debugger: https://developers.facebook.com/tools/debug/
2. Enter your URL and click "Debug"
3. You should see the correct meta tags

### 3. Test with Twitter

1. Use Twitter's Card Validator: https://cards-dev.twitter.com/validator
2. Enter your URL and click "Preview card"
3. You should see the correct card preview

### 4. Test with Instagram

1. Add a link to your Instagram bio
2. The link should show a rich preview when viewed

### 5. Manual Testing

You can test the function directly by setting your User-Agent to a social media crawler:

```bash
curl -H "User-Agent: facebookexternalhit/1.1" https://volleyball4-2.com/articles/32
```

This should return HTML with meta tags instead of redirecting to the React app.

## Supported Routes

The function currently supports:
- `/articles/*` - Article pages
- `/players/*` - Player profile pages
- `/teams/*` - Team pages
- `/games/*` - Game pages
- `/seasons/*` - Season pages
- `/awards/*` - Award pages

## Supported Social Media Platforms

- ✅ **Discord**
- ✅ **Facebook**
- ✅ **Instagram**
- ✅ **Twitter**
- ✅ **LinkedIn**
- ✅ **Slack**
- ✅ **Telegram**
- ✅ **WhatsApp**
- ✅ **Pinterest**
- ✅ **Snapchat**

## Troubleshooting

### Issue: Still seeing default meta tags

**Solution**: 
1. Check that your Netlify function is deployed correctly
2. Verify environment variables are set
3. Clear social media platform caches (Facebook Debugger, Twitter Validator)
4. Wait for crawlers to re-fetch (can take up to 24 hours)

### Issue: Function not working

**Solution**:
1. Check Netlify function logs in the dashboard
2. Verify your backend API is accessible
3. Test the function directly with curl

### Issue: Images not showing

**Solution**:
1. Ensure all images are served over HTTPS
2. Check that image URLs are accessible
3. Verify image dimensions are appropriate (1200x630px recommended)

## Performance

- **Caching**: Meta tags are cached for 1 hour
- **Fallback**: If function fails, users are redirected to the React app
- **User-Agent Detection**: Only social media crawlers trigger the function

## Maintenance

### Adding New Routes

To add support for new routes:

1. Update `netlify.toml` with new redirect rules
2. Add route handling in `netlify/functions/meta-tags.js`
3. Create meta tag generation function for the new content type

### Updating Meta Tags

The meta tags are generated dynamically, so they'll automatically reflect:
- Updated article titles
- New article images
- Changed descriptions
- Updated player information

## Alternative Solutions

If Netlify Functions don't work for you, consider:

1. **Static Site Generation**: Pre-generate HTML files for each route
2. **Server-Side Rendering**: Use Next.js or similar SSR framework
3. **Proxy Server**: Set up a proxy that serves meta tags for crawlers

## Support

If you encounter issues:
1. Check the Netlify function logs
2. Test with social media debugging tools
3. Verify your backend API is working
4. Check that all environment variables are set correctly 