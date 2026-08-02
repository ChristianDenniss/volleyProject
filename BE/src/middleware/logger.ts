import { Request, Response, NextFunction } from 'express';
import { sanitizeForLogging } from '../utils/sanitizeForLogging.js';

const RESPONSE_LOG_MAX = 200;

function truncateForLog(data: unknown): unknown {
    if (typeof data === 'string') {
        return data.length > RESPONSE_LOG_MAX
            ? `${data.substring(0, RESPONSE_LOG_MAX)}…[truncated]`
            : data;
    }
    try {
        const json = JSON.stringify(sanitizeForLogging(data));
        if (!json) return data;
        return json.length > RESPONSE_LOG_MAX
            ? `${json.substring(0, RESPONSE_LOG_MAX)}…[truncated]`
            : JSON.parse(json);
    } catch {
        return '[unserializable]';
    }
}

// Enhanced logger for comprehensive API tracking
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void
{
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Avoid logging PII like username; id + role is enough for correlation
    const user = (req as any).user;
    const userId = user?.id || 'unauthenticated';
    const userRole = user?.role || 'none';

    console.log(`\n🔍 [${timestamp}] API REQUEST START`);
    console.log(`📍 ${method} ${path}`);
    console.log(`👤 User: ID ${userId}, Role: ${userRole}`);
    console.log(`🌐 IP: ${ip}`);
    console.log(`🔧 User-Agent: ${userAgent}`);

    const authMethod = req.header('X-API-Key') ? 'API Key' :
                      req.header('Authorization') ? 'JWT Token' : 'None';
    console.log(`🔐 Auth Method: ${authMethod}`);

    if (Object.keys(req.query).length > 0) {
        console.log(`🔍 Query Params:`, JSON.stringify(sanitizeForLogging(req.query), null, 2));
    }

    if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        console.log(`📦 Request Body:`, JSON.stringify(sanitizeForLogging(req.body), null, 2));
    }

    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - new Date(timestamp).getTime();
        const statusCode = res.statusCode;

        console.log(`\n✅ [${new Date().toISOString()}] API REQUEST COMPLETE`);
        console.log(`📍 ${method} ${path} - Status: ${statusCode}`);
        console.log(`👤 User: ID ${userId}, Role: ${userRole}`);
        console.log(`⏱️  Response Time: ${responseTime}ms`);

        // Errors only, truncated + sanitized — do not dump full success bodies
        if (statusCode >= 400) {
            console.log(`❌ Error Response:`, truncateForLog(data));
        }

        console.log(`🔚 [${new Date().toISOString()}] REQUEST END\n`);

        return originalSend.call(this, data);
    };

    next();
}
