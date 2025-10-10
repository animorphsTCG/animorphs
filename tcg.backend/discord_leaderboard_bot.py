#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import asyncio
import asyncpg
import logging
from datetime import datetime
from typing import Optional, List, Tuple

import discord
from discord.ext import tasks, commands
from zoneinfo import ZoneInfo

# ----------------------------
# Configuration (ENV-DRIVEN)
# ----------------------------
DISCORD_TOKEN       = os.getenv("DISCORD_TOKEN")                 # e.g. "YOUR_BOT_TOKEN"
DISCORD_CHANNEL_ID  = int(os.getenv("DISCORD_CHANNEL_ID", "0"))  # numeric, required
UPDATE_INTERVAL_SEC = int(os.getenv("UPDATE_INTERVAL_SEC", "300"))  # default 5 min

PGHOST     = os.getenv("PGHOST", "localhost")
PGPORT     = int(os.getenv("PGPORT", "5432"))
PGDATABASE = os.getenv("PGDATABASE", "tcg")
PGUSER     = os.getenv("PGUSER", "")
PGPASSWORD = os.getenv("PGPASSWORD", "")

# Optional: store the pinned message id to avoid re-pinning every run
STATE_FILE = os.getenv("STATE_FILE", "/var/www/tcg.backend/discord_leaderboard_state.txt")

# Leaderboard query (Top 10 by ai_points, tie-break on total_wins desc, total_matches asc)
SQL_TOP10 = """
SELECT
    COALESCE(username, CONCAT('User#', user_id::text)) AS uname,
    ai_points,
    total_wins,
    total_matches
FROM leaderboards
WHERE ai_points IS NOT NULL
ORDER BY ai_points DESC, total_wins DESC, total_matches ASC
LIMIT 10;
"""

# Per-user stats query
SQL_USER = """
SELECT
    COALESCE(username, CONCAT('User#', user_id::text)) AS uname,
    ai_points,
    total_wins,
    total_matches
FROM leaderboards
WHERE (LOWER(username) = LOWER($1)) OR ($1 ~ '^[0-9]+$' AND user_id = $1::int)
LIMIT 1;
"""

# Intents: enable message content so commands work; guilds for cache/fetch
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
bot = commands.Bot(command_prefix="!", intents=intents)

log = logging.getLogger("leaderboard-bot")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

pool: Optional[asyncpg.Pool] = None
pinned_message_id: Optional[int] = None


# ----------------------------
# Helpers
# ----------------------------
def fmt_winrate(wins: Optional[int], matches: Optional[int]) -> str:
    if not matches or matches <= 0:
        return "—"
    wr = (wins or 0) / matches * 100.0
    return f"{wr:.0f}%"

def now_sast_string() -> str:
    try:
        tz = ZoneInfo("Africa/Johannesburg")
        return datetime.now(tz).strftime("%Y-%m-%d %H:%M SAST")
    except Exception:
        # Fallback to UTC if TZ not available
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

async def read_state() -> Optional[int]:
    try:
        with open(STATE_FILE, "r") as f:
            return int(f.read().strip())
    except Exception:
        return None

async def write_state(msg_id: int) -> None:
    try:
        with open(STATE_FILE, "w") as f:
            f.write(str(msg_id))
    except Exception as e:
        log.warning(f"Could not persist state file: {e}")

async def ensure_db_pool():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            host=PGHOST, port=PGPORT, database=PGDATABASE, user=PGUSER, password=PGPASSWORD,
            min_size=1, max_size=5
        )
        log.info("Connected to PostgreSQL")

async def fetch_top10() -> List[Tuple[str, int, int, int]]:
    await ensure_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(SQL_TOP10)
    return [(r["uname"], r["ai_points"], r["total_wins"], r["total_matches"]) for r in rows]

async def fetch_user(q: str) -> Optional[Tuple[str, int, int, int]]:
    await ensure_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(SQL_USER, q)
    if not row:
        return None
    return (row["uname"], row["ai_points"], row["total_wins"], row["total_matches"])

def render_leaderboard(rows: List[Tuple[str, int, int, int]]) -> str:
    header = "🏆 **Animorphs AI Points — Top 10**\n"
    updated = f"_Updated: {now_sast_string()}_\n\n"
    if not rows:
        return header + updated + "No data yet. Play some matches to appear here!"

    body_lines = []
    medals = ["🥇","🥈","🥉"]
    for idx, (uname, ai, wins, matches) in enumerate(rows, start=1):
        medal = medals[idx-1] if idx <= 3 else f"{idx}."
        wr = fmt_winrate(wins, matches)
        body_lines.append(f"{medal} **{uname}** — {ai or 0} AI Points · {wins or 0}/{matches or 0} wins · {wr} WR")

    footer = "\n\n_Type `!leaderboard` anytime, or `!mystats <username>` for your stats._"
    return header + updated + "\n".join(body_lines) + footer

async def get_or_create_pinned_message(channel: discord.TextChannel) -> discord.Message:
    global pinned_message_id
    # Try state file first
    if pinned_message_id is None:
        pinned_message_id = await read_state()

    if pinned_message_id:
        try:
            msg = await channel.fetch_message(pinned_message_id)
            return msg
        except Exception:
            pass  # falls through to create new

    # Look for existing pinned message by the bot
    pins = await channel.pins()
    for m in pins:
        if m.author == bot.user:
            pinned_message_id = m.id
            await write_state(pinned_message_id)
            return m

    # Create a new message and pin it
    msg = await channel.send("Initializing leaderboard…")
    await msg.pin()
    pinned_message_id = msg.id
    await write_state(pinned_message_id)
    return msg

async def resolve_leaderboard_channel() -> Optional[discord.TextChannel]:
    """Resolve the leaderboard channel using cache first, then API fetch as fallback."""
    ch = bot.get_channel(DISCORD_CHANNEL_ID)
    if isinstance(ch, discord.TextChannel):
        return ch
    try:
        fetched = await bot.fetch_channel(DISCORD_CHANNEL_ID)
        if isinstance(fetched, discord.TextChannel):
            return fetched
    except Exception as e:
        log.error(f"fetch_channel failed for {DISCORD_CHANNEL_ID}: {e}")
    return None


# ----------------------------
# Tasks
# ----------------------------
@tasks.loop(seconds=UPDATE_INTERVAL_SEC)
async def updater():
    channel = await resolve_leaderboard_channel()
    if not channel:
        log.error("Leaderboard channel not found or misconfigured.")
        return

    rows = await fetch_top10()
    content = render_leaderboard(rows)
    try:
        msg = await get_or_create_pinned_message(channel)
        await msg.edit(content=content)
    except discord.HTTPException as e:
        log.error(f"Failed to edit leaderboard message: {e}")


# ----------------------------
# Commands
# ----------------------------
@bot.command(name="leaderboard")
async def cmd_leaderboard(ctx: commands.Context):
    rows = await fetch_top10()
    content = render_leaderboard(rows)
    await ctx.send(content)

@bot.command(name="mystats")
async def cmd_mystats(ctx: commands.Context, *, query: str = ""):
    """
    Usage:
      !mystats <username>
      !mystats <numeric_user_id>
      !mystats            (tries author's Discord display name as lookup)
    """
    q = query.strip() or ctx.author.display_name
    row = await fetch_user(q)
    if not row:
        await ctx.send(f"Couldn't find stats for `{q}`.")
        return

    uname, ai, wins, matches = row
    await ctx.send(
        f"📊 **{uname}** — {ai or 0} AI Points | {wins or 0}/{matches or 0} wins | {fmt_winrate(wins, matches)} win rate"
    )


# ----------------------------
# Lifecycle
# ----------------------------
@bot.event
async def on_ready():
    log.info(f"Logged in as {bot.user} (id={bot.user.id})")
    # Helpful once to confirm the channel id you copied
    for g in bot.guilds:
        log.info(f"Guild: {g.name} ({g.id})")
        for ch in g.text_channels:
            log.info(f"  #{ch.name} -> {ch.id}")
    if not updater.is_running():
        updater.start()

def main():
    if not DISCORD_TOKEN:
        raise SystemExit("DISCORD_TOKEN is not set")
    if DISCORD_CHANNEL_ID == 0:
        raise SystemExit("DISCORD_CHANNEL_ID must be set to a numeric channel ID")
    bot.run(DISCORD_TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except RuntimeError:
        # Fallback for environments where an event loop is already running
        main()
