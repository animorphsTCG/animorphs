
# Database Maintenance Strategy

This document outlines our approach to keeping the database size under the 500MB free-tier limit while supporting up to 200 simultaneous users.

## Automated Pruning Strategy

We've implemented an automated pruning system that:

1. Archives completed battle data older than 30 days
2. Monitors database size and table growth
3. Uses efficient indexes to optimize query performance
4. Follows a scheduled pruning approach

## Components

### 1. Database Functions

- `archive_old_battles(days_threshold INTEGER)`: Archives battle sessions older than the specified threshold

### 2. Edge Function

- `db-maintenance`: Exposes endpoints to trigger maintenance tasks and check database size

### 3. Scheduled Execution

To ensure the database stays under limits:

1. Set up a weekly cron job to call the maintenance edge function:
   ```
   0 0 * * 0 curl -X POST https://orrmjadspjsbdfnhnkgu.supabase.co/functions/v1/db-maintenance -H "Content-Type: application/json" -d '{"action":"archive_battles","days_threshold":30}'
   ```

2. Set up a daily monitoring job:
   ```
   0 0 * * * curl -X POST https://orrmjadspjsbdfnhnkgu.supabase.co/functions/v1/db-maintenance -H "Content-Type: application/json" -d '{"action":"db_size"}'
   ```

## Table Growth Control

To prevent unchecked growth:

1. **Battles and Game Data**:
   - Battle sessions older than 30 days are archived
   - Only store essential game data needed for leaderboards and stats

2. **User Profiles**:
   - Keep minimal data in profiles table
   - Use efficient data types (e.g., enums instead of strings where possible)

3. **Realtime Optimizations**:
   - Subscribe only to specific rows, not entire tables
   - Unsubscribe when data is no longer needed

## Scaling Guidelines

If approaching the 500MB limit:

1. Increase pruning frequency (reduce days_threshold)
2. Archive less-used data to external storage
3. Consider database sharding or upgrading to a paid tier

By following these guidelines, the database should comfortably support 200 simultaneous users while staying under the 500MB free-tier limit.
