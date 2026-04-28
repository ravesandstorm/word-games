import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { Server as SocketIOServer } from "socket.io";
import { defineEventHandler } from "h3";
import { Room } from "../models/Room";
import type { Player } from "../../types/game";

export default defineNitroPlugin((nitroApp: NitroApp) => {
    try {
        const engine = new Engine({
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        const io = new SocketIOServer({
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        if (!engine || !io) {
            console.error("[SOCKET.IO] ✗ Failed to create instances");
            return;
        }

        io.bind(engine);
        console.log("[SOCKET.IO] ✓ Socket.IO bound to Engine.IO");

        // CRITICAL: Handle both /socket.io/ routes
        nitroApp.router.use(
            "/socket.io/",
            defineEventHandler({
                handler(event) {
                    try {
                        // Don't read body for socket.io requests
                        if (!event.node?.req || !event.node?.res) {
                            console.error("[SOCKET.IO] ✗ Missing req/res");
                            return;
                        }

                        console.log(
                            `[SOCKET.IO] HTTP ${event.node.req.method} ${event.node.req.url}`
                        );

                        engine.handleRequest(event.node.req as any, event.node.res as any);
                        event._handled = true;
                    } catch (error) {
                        console.error("[SOCKET.IO] ✗ Handler error:", error);
                    }
                },
                websocket: {
                    open(peer) {
                        try {
                            console.log("[SOCKET.IO] WebSocket opening...");

                            const internal = (peer as any)._internal;
                            if (!internal?.nodeReq?.socket || !peer.websocket) {
                                console.error("[SOCKET.IO] ✗ Missing WebSocket components");
                                return;
                            }

                            (engine as any).prepare(internal.nodeReq);
                            (engine as any).onWebSocket(
                                internal.nodeReq,
                                internal.nodeReq.socket,
                                peer.websocket
                            );

                            console.log("[SOCKET.IO] ✓ WebSocket opened");
                        } catch (error) {
                            console.error("[SOCKET.IO] ✗ WebSocket open error:", error);
                        }
                    },
                    close(peer) {
                        console.log("[SOCKET.IO] WebSocket closed");
                    },
                    error(peer, error) {
                        console.error("[SOCKET.IO] ✗ WebSocket error:", error);
                    },
                },
            })
        );

        console.log("[SOCKET.IO] ✓ Router configured");

        io.on("connection", (socket) => {
            console.log(`[SOCKET.IO] ✓✓✓ CLIENT CONNECTED: ${socket.id} ✓✓✓`);

            // Send welcome message
            socket.emit("connected", { message: "Welcome!", id: socket.id });

            socket.on(
                "join-room",
                async (data: {
                    roomCode: string;
                    playerId: string;
                    playerName: string;
                }) => {
                    try {
                        const { roomCode, playerId, playerName } = data;

                        if (!roomCode || !playerId || !playerName) {
                            console.error("[SOCKET.IO] ✗ Missing fields:", {
                                roomCode,
                                playerId,
                                playerName,
                            });
                            socket.emit("error", { message: "Missing required fields" });
                            return;
                        }

                        console.log(
                            `[SOCKET.IO] JOIN-ROOM: ${playerName} (${playerId}) -> ${roomCode}`
                        );

                        const room = await Room.findOne({
                            roomCode: roomCode.toUpperCase(),
                        });

                        if (!room) {
                            console.error(`[SOCKET.IO] ✗ Room not found: ${roomCode}`);
                            socket.emit("error", { message: "Room not found" });
                            return;
                        }

                        const existingPlayer = room.players.find(
                            (p: Player) => p.id === playerId
                        );
                        if (!existingPlayer) {
                            room.players.push({
                                id: playerId,
                                name: playerName,
                                score: 0,
                                isLocal: false,
                            });
                            await room.save();
                            console.log(`[SOCKET.IO] ✓ Player added: ${playerName}`);
                        }

                        socket.join(roomCode);
                        console.log(`[SOCKET.IO] ✓ Socket joined room: ${roomCode}`);

                        io.to(roomCode).emit("room-updated", {
                            players: room.players,
                            gameState: room.gameState,
                        });

                        console.log(
                            `[SOCKET.IO] ✓✓ ${playerName} in ${roomCode}. Players: ${room.players.length}`
                        );
                    } catch (err) {
                        console.error("[SOCKET.IO] ✗ join-room error:", err);
                        socket.emit("error", {
                            message: "Failed to join",
                            details: String(err),
                        });
                    }
                }
            );

            socket.on(
                "leave-room",
                async (data: { roomCode: string; playerId: string }) => {
                    try {
                        const { roomCode, playerId } = data;

                        if (!roomCode || !playerId) {
                            console.error("[SOCKET.IO] ✗ Missing fields in leave-room");
                            return;
                        }

                        console.log(`[SOCKET.IO] LEAVE-ROOM: ${playerId} <- ${roomCode}`);

                        const room = await Room.findOne({
                            roomCode: roomCode.toUpperCase(),
                        });

                        if (room) {
                            room.players = room.players.filter(
                                (p: Player) => p.id !== playerId
                            );
                            await room.save();
                            socket.leave(roomCode);

                            io.to(roomCode).emit("room-updated", {
                                players: room.players,
                                gameState: room.gameState,
                            });

                            console.log(
                                `[SOCKET.IO] ✓ Player left ${roomCode}. Players: ${room.players.length}`
                            );
                        }
                    } catch (err) {
                        console.error("[SOCKET.IO] ✗ leave-room error:", err);
                    }
                }
            );

            socket.on(
                "update-game-state",
                async (data: { roomCode: string; gameState: any }) => {
                    try {
                        const { roomCode, gameState } = data;

                        if (!roomCode || !gameState) {
                            console.error(
                                "[SOCKET.IO] ✗ Missing fields in update-game-state"
                            );
                            return;
                        }

                        console.log(`[SOCKET.IO] UPDATE-GAME-STATE: ${roomCode}`);

                        const room = await Room.findOne({
                            roomCode: roomCode.toUpperCase(),
                        });

                        if (room) {
                            room.gameState = { ...room.gameState, ...gameState };
                            await room.save();

                            io.to(roomCode).emit("game-state-updated", {
                                gameState: room.gameState,
                            });

                            console.log(`[SOCKET.IO] ✓ Game state updated: ${roomCode}`);
                        }
                    } catch (err) {
                        console.error("[SOCKET.IO] ✗ update-game-state error:", err);
                    }
                }
            );

            socket.on("disconnect", () => {
                console.log(`[SOCKET.IO] ✗ Client disconnected: ${socket.id}`);
            });

            socket.on("error", (error) => {
                console.error(`[SOCKET.IO] ✗ Socket error ${socket.id}:`, error);
            });
        });

        (nitroApp as any).io = io;
        console.log("[SOCKET.IO] ✓✓✓ INITIALIZATION COMPLETE ✓✓✓");
    } catch (error) {
        console.error("[SOCKET.IO] ✗✗✗ FATAL ERROR:", error);
    }
});
