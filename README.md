This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production in Docker

1. Create the production environment file from the template and fill in the values:

   ```bash
   cp .env.example .env
   ```

   `NEXT_PUBLIC_API_BASE_URL` must be an address accessible from the user's browser (for example, the public API domain). It is inserted into the client bundle during the image build, so rebuild the image after changing any `NEXT_PUBLIC_*` value.

2. Build and run the image:

   ```bash
   docker build -t vera-web:latest .
   docker run -d --name vera-web --restart unless-stopped --env-file .env -p 3000:3000 vera-web:latest
   ```

The container serves the production Next.js build on port `3000`. Put a reverse proxy (for example, Nginx) in front of it for the domain and TLS. The `.env` file is used during the build for public variables and passed at startup for server-only variables such as the geocoding settings; it is not copied into the final image.
