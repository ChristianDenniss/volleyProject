# 🔑 API Key Generator Guide

Your admin dashboard now includes a built-in API key generator! Here's how to use it:

## **How to Generate an API Key**

### **Step 1: Access the Dashboard**
1. Log into your admin account
2. Go to the admin dashboard (`/portal/dashboard`)
3. Look for the "Generate API Key" button in the Quick Actions section

### **Step 2: Generate the Key**
1. Click the "Generate API Key" button
2. Wait for the key to be generated (only admins can do this)
3. The key will appear in a beautiful purple section below

### **Step 3: Copy and Use**
1. Click the "Copy" button to copy the key to your clipboard
2. Add it to your `.env` file: `API_SECRET_KEY=your-generated-key-here`
3. Restart your backend server
4. Use it in Postman or other tools

## **Using the API Key**

### **In Postman:**
Add this header to your requests:
```
X-API-Key: your-generated-key-here
```

### **Example Postman Request:**
```
POST http://localhost:3000/api/players
Headers:
  X-API-Key: K8mP2nQ9rS5tU7vW1xY3zA6bC4dE8fG0hI2jK5lM7nO9pQ1rS3tU5vW7xY9zA
  Content-Type: application/json
Body:
  {
    "name": "John Doe",
    "teamId": 1
  }
```

### **In cURL:**
```bash
curl -X POST http://localhost:3000/api/players \
  -H "X-API-Key: your-generated-key-here" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "teamId": 1}'
```

## **Security Features**

✅ **Admin Only**: Only admin/superadmin users can generate keys  
✅ **Secure Generation**: Uses cryptographically secure random generation  
✅ **One-Time Display**: Key is only shown once after generation  
✅ **Copy Protection**: Easy one-click copy to clipboard  
✅ **Clear Instructions**: Step-by-step usage guide included  

## **What the API Key Gives You Access To**

### **Full Access to Protected Endpoints:**
- ✅ Create players, games, stats, teams, seasons, awards, records, articles
- ✅ Update any data
- ✅ Delete any data
- ✅ Calculate records
- ✅ Like/unlike articles

### **Public Access (No Key Needed):**
- ✅ View all data (GET endpoints)

## **Important Security Notes**

⚠️ **Keep Your Key Secret**: Anyone with this key can access your API  
⚠️ **Don't Share Publicly**: Never commit API keys to version control  
⚠️ **Rotate Regularly**: Generate new keys periodically for security  
⚠️ **Monitor Usage**: Watch for unusual API activity  

## **Troubleshooting**

### **"Failed to generate API key"**
- Make sure you're logged in as an admin/superadmin
- Check that your JWT token is valid
- Ensure the backend server is running

### **"Invalid API key" in Postman**
- Make sure you added the key to your `.env` file
- Restart your backend server after adding the key
- Check that the header is exactly: `X-API-Key: your-key-here`

### **Key not working**
- Verify the key was copied correctly (no extra spaces)
- Make sure the server was restarted after adding to `.env`
- Check that the environment variable is named `API_SECRET_KEY`

## **Need Help?**

If you're having issues:
1. Check the browser console for errors
2. Verify your admin privileges
3. Make sure your backend server is running
4. Check that the `.env` file is in the correct location

Your API is now secure and easy to access! 🎉 