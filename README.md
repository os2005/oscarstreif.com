# oscarstreif.com

Personal website for Oscar Streif.

Stack:

- Next.js
- TypeScript
- Tailwind CSS
- App Router

Local development:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Deployment target:

- Hetzner VPS
- Cloudflare DNS
- Nginx reverse proxy
- HTTPS with Let's Encrypt or a Cloudflare-compatible SSL setup

Deployment checklist:

1. Point `oscarstreif.com` and `www.oscarstreif.com` to the server in Cloudflare.
2. Install Node.js 20+, nginx and certbot on the VPS.
3. Copy the repo to `/var/www/oscarstreif.com/current`.
4. Run `npm ci` and `npm run build`.
5. Install the systemd unit from `deploy/systemd/oscarstreif.service`.
6. Install the nginx config from `deploy/nginx/oscarstreif.com.conf`.
7. Issue certificates with Let's Encrypt.
8. Start the app and reload nginx.

Recommended server commands:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo mkdir -p /var/www/oscarstreif.com
```

App setup:

```bash
cd /var/www/oscarstreif.com/current
npm ci
npm run build
```

Systemd:

```bash
sudo cp deploy/systemd/oscarstreif.service /etc/systemd/system/oscarstreif.service
sudo systemctl daemon-reload
sudo systemctl enable oscarstreif.service
sudo systemctl start oscarstreif.service
sudo systemctl status oscarstreif.service
```

Nginx:

```bash
sudo cp deploy/nginx/oscarstreif.com.bootstrap.conf /etc/nginx/sites-available/oscarstreif.com.conf
sudo ln -s /etc/nginx/sites-available/oscarstreif.com.conf /etc/nginx/sites-enabled/oscarstreif.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

TLS:

```bash
sudo certbot --nginx -d oscarstreif.com -d www.oscarstreif.com
```

After the first successful certbot run, replace the bootstrap config with the TLS config:

```bash
sudo cp deploy/nginx/oscarstreif.com.conf /etc/nginx/sites-available/oscarstreif.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

Notes:

- The production service uses `npm run start`, which serves the compiled `.next` output directly.
- `robots.txt` and `sitemap.xml` are generated through Next metadata routes.
- The systemd unit expects the deployed repo at `/var/www/oscarstreif.com/current`.
- Use `deploy/nginx/oscarstreif.com.bootstrap.conf` before the first certificate is issued.
- Authentication data is stored locally on the server under `/var/lib/oscarstreif/auth-store.json`.
- Replace the placeholder `AUTH_SECRET` in the systemd unit with a long random value before production use.
