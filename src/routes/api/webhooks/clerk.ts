import { env } from 'cloudflare:workers';
import { createFileRoute } from '@tanstack/react-router';
import { Webhook } from 'svix';

type ClerkWebhookEvent = {
  type: string;
  data: { id: string };
};

export const Route = createFileRoute('/api/webhooks/clerk')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = env.CLERK_WEBHOOK_SECRET;
        if (!secret) {
          return new Response('Webhook secret not configured', { status: 500 });
        }

        const svixId = request.headers.get('svix-id');
        const svixTimestamp = request.headers.get('svix-timestamp');
        const svixSignature = request.headers.get('svix-signature');
        if (!svixId || !svixTimestamp || !svixSignature) {
          return new Response('Missing Svix headers', { status: 400 });
        }

        const body = await request.text();

        let event: ClerkWebhookEvent;
        try {
          event = new Webhook(secret).verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
          }) as unknown as ClerkWebhookEvent;
        } catch {
          return new Response('Invalid signature', { status: 400 });
        }

        // TODO: handle webhooks
        console.log(event);
      },
    },
  },
});
