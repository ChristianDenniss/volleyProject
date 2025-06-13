import { Request, Response } from 'express';

export class RobloxController
{
    async getAvatarByUsername(req: Request, res: Response): Promise<void>
    {
        try
        {
            const username = req.params.username;

            // Step 1: Get userId from username
            const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames: [username] })
            });

            const userJson = await userRes.json();
            const userId = userJson.data?.[0]?.id;

            if (!userId)
            {
                res.status(404).json({ error: 'User not found on Roblox.' });
                return;
            }

            // Step 2: Get imageUrl from avatar thumbnail API
            const thumbRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`
            );

            const thumbJson = await thumbRes.json();
            const imageUrl = thumbJson?.data?.[0]?.imageUrl;

            if (!imageUrl)
            {
                res.status(500).json({ error: 'Image URL not available.' });
                return;
            }

            // Ensure the URL is properly formatted
            const finalUrl = imageUrl.startsWith('https://') ? imageUrl : `https://${imageUrl}`;
            res.json({ avatarUrl: finalUrl });
        }
        catch (error)
        {
            console.error('Failed to fetch avatar:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}
