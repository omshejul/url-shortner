cd /home/om/server/url-shortner

pm2 start --name "url-shortner" pnpm -- run start --port 3008

pnpm run build

pm2 restart url-shortner

pm2 logs url-shortner

pm2 stop url-shortner