import { z } from "zod";

// Base schema for record creation
const baseRecordSchema = z.object({
    record: z.enum([
        'most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows', 'most blocks', 'most aces', 'most serve errors',
        'most misc errors', 'most set errors', 'most spike errors', 'most spike attempts', 'most ape attempts', 'most total kills', 
        'most total attempts', 'most total errors', 'best total spiking % with 10+ attempts', 'best total spiking % with 20+ attempts', 
        'best total spiking % with 30+ attempts', 'best total spiking % with 40+ attempts', 'best total spiking % with 50+ attempts', 
        'best total spiking % with 60+ attempts', 'best total spiking % with 70+ attempts', 'best total spiking % with 80+ attempts', 
        'best total spiking % with 90+ attempts', 'best total spiking % with 100+ attempts', 'best total spiking % with 110+ attempts', 
        'best total spiking % with 120+ attempts', 'best total spiking % with 130+ attempts', 'best total spiking % with 140+ attempts', 
        'best total spiking % with 150+ attempts', 'best total spiking % with 160+ attempts', 'best total spiking % with 170+ attempts', 
        'best total spiking % with 180+ attempts', 'best total spiking % with 190+ attempts', 'best total spiking % with 200+ attempts', 
        'best total spiking % with 210+ attempts', 'best total spiking % with 220+ attempts', 'best total spiking % with 230+ attempts', 
        'best total spiking % with 240+ attempts', 'best total spiking % with 250+ attempts'
    ], { message: "Invalid record type" }),
    type: z.enum(['game', 'season'], { message: "Type must be 'game' or 'season'" }),
    rank: z.number().int().positive().min(1, { message: "Rank must be at least 1" }).max(10, { message: "Rank must be at most 10" }),
    value: z.number().min(0, { message: "Value must be at least 0" }),
    date: z.string().datetime({ message: "Date is required" }).or(z.date({ message: "Date is required" })),
    seasonId: z.number().int().positive({ message: "Season ID is required" }),
    playerId: z.number().int().positive({ message: "Player ID is required" }),

});

export const createRecordSchema = baseRecordSchema;

// Update schema (patch-like with optional fields)
export const updateRecordSchema = baseRecordSchema.partial();

// Inferred DTOs
export type CreateRecordDto = z.infer<typeof createRecordSchema>;
export type UpdateRecordDto = z.infer<typeof updateRecordSchema>;