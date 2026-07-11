import { Request, Response, NextFunction } from 'express';
import { sanitizeForLogging } from '../utils/sanitizeForLogging.js';

// Enhanced logger for comprehensive API tracking
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void
{
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Get user info if authenticated
    const user = (req as any).user;
    const userId = user?.id || 'unauthenticated';
    const userRole = user?.role || 'none';
    const username = user?.username || 'anonymous';
    
    // Log request start
    console.log(`\n🔍 [${timestamp}] API REQUEST START`);
    console.log(`📍 ${method} ${path}`);
    console.log(`👤 User: ${username} (ID: ${userId}, Role: ${userRole})`);
    console.log(`🌐 IP: ${ip}`);
    console.log(`🔧 User-Agent: ${userAgent}`);
    
    // Log authentication method
    const authMethod = req.header('X-API-Key') ? 'API Key' : 
                      req.header('Authorization') ? 'JWT Token' : 'None';
    console.log(`🔐 Auth Method: ${authMethod}`);
    
    // Log query parameters
    if (Object.keys(req.query).length > 0) {
        console.log(`🔍 Query Params:`, JSON.stringify(req.query, null, 2));
    }
    
    // Log request body (for non-GET requests)
    if (method !== 'GET' && Object.keys(req.body).length > 0) {
        console.log(`📦 Request Body:`, JSON.stringify(sanitizeForLogging(req.body), null, 2));
    }
    
    // Track response
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - new Date(timestamp).getTime();
        const statusCode = res.statusCode;
        
        console.log(`\n✅ [${new Date().toISOString()}] API REQUEST COMPLETE`);
        console.log(`📍 ${method} ${path} - Status: ${statusCode}`);
        console.log(`👤 User: ${username} (ID: ${userId}, Role: ${userRole})`);
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        
        // Log response data for errors or important operations
        if (statusCode >= 400) {
            console.log(`❌ Error Response:`, data);
        } else if (method !== 'GET' && statusCode >= 200 && statusCode < 300) {
            console.log(`✅ Success Response:`, typeof data === 'string' ? data.substring(0, 200) + '...' : data);
        }
        
        console.log(`🔚 [${new Date().toISOString()}] REQUEST END\n`);
        
        return originalSend.call(this, data);
    };
    
    next();
}
