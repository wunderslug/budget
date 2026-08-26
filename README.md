# Weekly Money Planner

A deliberately simple weekly cash-flow planner.

## Start it

```bash
docker compose up -d --build
```

Open:

`http://YOUR-SERVER-IP:3025`

Data is saved to `./data/state.json`, so it persists when the container is rebuilt or restarted.

## Cloudflare Tunnel

Point your hostname to:

`http://YOUR-SERVER-IP:3025`

or, if cloudflared runs on the same Docker network, to the appropriate container/service address.

## UX

- Current balance and weekly income are edited directly where they appear.
- Expense editing expands directly beneath the expense row.
- Press Enter to save the balance or weekly income.
- Forecast updates immediately after each saved change.
- Calm dark dashboard styling with restrained status colors.

## Privacy

`data/state.json` contains personal financial data and is intentionally ignored by Git.
