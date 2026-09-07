import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth";
import { subscribeToAdminEvents } from "@/server/services/notification.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized. Admin session required for real-time stream." },
      { status: 401 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected handshake event
      const initialPayload = `event: connected\ndata: ${JSON.stringify({
        status: "connected",
        user: session.email,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // 2. Subscribe to real-time notification events
      const unsubscribe = subscribeToAdminEvents((payload) => {
        try {
          const sseData = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          // Stream closed by client
        }
      });

      // 3. Heartbeat keep-alive every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const ping = `event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      // 4. Handle client abort/close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
