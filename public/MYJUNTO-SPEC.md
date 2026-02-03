# MyJunto.xyz - Application Specification

*Authoritative specification - reference this before making any changes*

## What MyJunto.xyz Is

An app to aggregate information and opinions from disparate sources and deliver it to users in a clean, readable format with clear citations in the form of a daily newsletter.

## User Onboarding Flow

1. **Connect via x.com** (eventually support google login)
2. **Enter email address** to receive newsletters
3. **Select Twitter profiles** to include as sources for their newsletter from their following list or enter manually. Support up to 10 to start
4. **Select keywords** to emphasize in newsletter generation. Support up to 10 to start with user able to add custom ones in addition to globally available ones (Bitcoin, DeFi, Ethereum, Commodities, AI)
5. **Select timezone and delivery time**. Default to user's timezone at 6:00 AM

## Backend Processing Flow

1. **Cron job runs every 5 minutes** at https://console.cron-job.org/dashboard
2. **Looks for users** with delivery times less than current time that have not had a newsletter delivered
3. **Aggregates unique sources** - looks at all users due for newsletter, sees all unique sources (Twitter profiles) those users have selected
4. **Retrieves new tweets** from those sources over the last 72 hours (new = not in database)
5. **Generates appropriate newsletters** using this info
6. **Sends newsletters to users**

## Database Structure

- **Users** - user and user settings
- **Profiles** - Twitter profiles being followed  
- **User_profiles** - profiles users have selected
- **Tweets** - tweets pulled in to be used as sources for newsletters
- **Newsletters** - newsletters generated and sent, connects back to user
- **Scheduling_logs** - log for newsletter checks

## Development Guidelines

- **Reference this spec** before making any changes
- **Don't break existing functionality** when adding features
- **Test end-to-end** before deploying
- **Document any schema changes** with clear migration paths
- **No hardcoded data** in migrations or code

---

*Last updated: 2026-02-03*
*Any changes to core functionality should update this document*