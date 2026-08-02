import { Request, Response, NextFunction } from 'express';

export class RobloxController
{
    getAvatarByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const username = req.params.username;

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

            const thumbRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`
            );

            const thumbJson = await thumbRes.json();
            const imageUrl = thumbJson?.data?.[0]?.imageUrl;

            if (!imageUrl)
            {
                res.status(404).json({ error: 'Image URL not available.' });
                return;
            }

            const finalUrl = imageUrl.startsWith('https://') ? imageUrl : `https://${imageUrl}`;
            res.json({ avatarUrl: finalUrl });
        }
        catch (error)
        {
            next(error);
        }
    }
}
