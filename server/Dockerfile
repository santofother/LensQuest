FROM node:22-alpine
WORKDIR /server
ENV NODE_ENV=production
COPY multiplayer.mjs ./multiplayer.mjs
USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:8787/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "multiplayer.mjs"]
