import asyncio
import json

from fastapi.responses import StreamingResponse


class SSEManager:

    def __init__(self):

        self.clients = set()


    async def subscribe(self):

        queue = asyncio.Queue()

        self.clients.add(queue)

        try:

            while True:

                data = await queue.get()

                yield (
                    f"data: "
                    f"{json.dumps(data)}"
                    f"\n\n"
                )

        finally:

            self.clients.discard(queue)


    async def broadcast(self, data):

        disconnected = []

        for queue in self.clients:

            try:

                await queue.put(data)

            except Exception:

                disconnected.append(queue)


        for queue in disconnected:

            self.clients.discard(queue)


    def response(self):

        return StreamingResponse(
            self.subscribe(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )