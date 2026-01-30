# MyJunto Product Plan: Shared Database & Email Ingestion

## Executive Summary

This plan outlines the integration of MyJunto with Jon's personal daily portfolio reports and the implementation of email/newsletter ingestion capabilities. The goal is to create a unified content synthesis platform while maintaining product independence.

## 1. Shared Tweet Database Integration

### Objective
Leverage MyJunto's existing tweet ingestion and analysis infrastructure to feed Jon's personal daily portfolio reports without merging the products.

### Implementation Plan

#### Phase 1: Database Access Layer
- Create a secure API endpoint in MyJunto to expose tweet data
- Implement authentication using API keys or JWT tokens
- Add filtering capabilities by date range, handles, and engagement metrics
- Include tweet metadata (likes, retweets, posting time, profile information)

#### Phase 2: Data Pipeline
- Set up a scheduled job in the dashboard product to fetch tweets from MyJunto
- Transfer window: Daily at 6 AM UTC for the previous 24-48 hours
- Include both recent tweets and context tweets (6-month historical data)
- Maintain data freshness with real-time sync options for breaking news

#### Phase 3: Integration Architecture
```
MyJunto Backend ←→ Secure API ←→ Dashboard Product
     ↓                    ↓              ↓
Tweet Database      Filtered Tweets   Portfolio Reports
```

### Technical Requirements
- API rate limiting: 100 requests per hour per client
- Data format: JSON with standardized schema
- Error handling with exponential backoff
- Audit logging for all data access

### Benefits
- MyJunto maintains its standalone functionality
- Dashboard product gains access to curated, analyzed tweet data
- Shared infrastructure reduces duplicate data storage
- Enables portfolio-specific newsletter generation using tweet insights

## 2. Email/Newsletter Ingestion Feature

### Objective
Allow users to ingest newsletter content via unique email addresses and integrate it with AI analysis alongside tweets.

### User Experience Flow

#### 1. Email Address Generation
- Each user receives a unique email address: `{userId}@in.myjunto.xyz`
- Address is auto-generated and displayed in user settings
- One address per user (no custom aliases initially)

#### 2. Newsletter Subscription Options
**Option A: Personal Email Forwarding**
- Users forward newsletters from their personal email
- System accepts emails from any sender (no whitelist)
- Supports multiple newsletters per user

**Option B: Shared Newsletter Library**
- Users can browse newsletters other users have subscribed to
- Popular newsletters are pre-categorized (Crypto, Tech, Finance, etc.)
- One-click subscription to shared newsletters
- Privacy: User email addresses are never exposed

#### 3. Content Processing Pipeline
```
Email Received → Content Extraction → AI Analysis → Database Storage → Synthesis Integration
```

### Technical Implementation

#### Email Infrastructure
- Provider: Resend Inbound (already integrated)
- Webhook endpoint: `/api/webhooks/email-received`
- Support for HTML, plain text, and multipart emails
- 25MB size limit per email

#### Content Processing
- Extract main article content (remove headers, footers, ads)
- Identify newsletter source (Substack, Beehiiv, custom)
- Parse metadata: sender, subject, send date
- Store original email for 30 days

#### AI Integration
- Newsletter content is processed alongside tweets
- Weighted analysis based on user preferences
- Watchlist term matching across all content types
- Unified synthesis in daily briefings

### Database Schema Additions
- `user_email_addresses`: Store unique email addresses
- `ingested_emails`: Store parsed newsletter content
- `email_attachments`: Handle file attachments
- `watchlist_matches`: Track keyword matches across content types

### User Interface Updates
- **Email Settings Page**: Display unique address and forwarding instructions
- **Newsletter Library**: Browse and subscribe to shared newsletters
- **Content Management**: View ingested content, toggle inclusion in briefings
- **Analytics**: Track ingestion volume and engagement

## 3. Updated Output Prompt

### Current Prompt (v3.1)
The existing prompt creates a "daily intelligence briefing for a crypto/finance professional" with:
- Academic citation style
- Sentiment analysis
- Actionable intelligence section
- Cross-referencing of sources
- Dense, information-rich content

### New Professional Prompt (v4.0)

#### Objectives
- More professional tone suitable for executive audiences
- Enhanced clarity and readability
- Stronger narrative flow
- Executive summary format
- Action-oriented recommendations

#### Key Changes
1. **Opening Executive Summary**: 2-3 sentence overview of the day's key insights
2. **Professional Tone**: Replace "crypto/finance professional" with "investment professional"
3. **Structured Sections**: Clear hierarchy with bullet points for scanability
4. **Action Items**: Explicit "Key Actions to Consider" section
5. **Risk Assessment**: Dedicated section for risk factors and considerations

#### Implementation
- Create new prompt file: `prompts/professional-v4.md`
- Maintain version control with A/B testing capability
- Allow users to switch between prompt versions
- Monitor engagement metrics for each version

### A/B Testing Plan
- 50/50 split testing between v3.1 and v4.0
- Track metrics: open rates, click-through rates, time spent reading
- User feedback collection via in-app survey
- Decision criteria after 30 days of testing

## 4. Implementation Timeline

### Week 1-2: Shared Database
- Set up secure API endpoints
- Implement data transfer pipeline
- Test integration with dashboard product

### Week 3-4: Email Infrastructure
- Configure Resend inbound processing
- Implement content parsing pipeline
- Create database schema for email storage

### Week 5-6: User Interface
- Build email settings page
- Create newsletter library interface
- Add content management features

### Week 7-8: Testing & Launch
- Conduct user acceptance testing
- Implement A/B testing for new prompt
- Monitor performance and user adoption

## 5. Success Metrics

### Shared Database
- API uptime: >99.9%
- Data transfer latency: <5 minutes
- Successful sync rate: >99%

### Email Ingestion
- Email processing time: <30 seconds
- Parsing accuracy: >95%
- User adoption rate: >30% within 60 days

### Content Quality
- User satisfaction score: >4.0/5.0
- Reduction in information overload complaints
- Increase in daily active users

## 6. Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching and request batching
- **Email Deliverability**: Monitor spam scores and sender reputation
- **Content Quality**: Maintain human oversight for AI-generated content

### User Adoption Risks
- **Complexity**: Provide clear onboarding and tutorials
- **Privacy Concerns**: Transparent data handling policies
- **Content Overload**: Allow granular control over content sources

## 7. Future Enhancements

### Phase 2 Features
- RSS feed ingestion
- Podcast transcription and analysis
- Slack/Discord channel monitoring
- Custom content source connectors

### Advanced Analytics
- Content engagement scoring
- Personalized content recommendations
- Trend analysis across sources
- Export capabilities for professional use

## Conclusion

This plan positions MyJunto as a comprehensive content synthesis platform while maintaining its core identity. The shared database integration provides immediate value to Jon's portfolio reports, while email ingestion opens new revenue opportunities and user engagement possibilities. The professional prompt update ensures the product evolves with user needs and market expectations.