# Technical Implementation Guide

## Recommended Tech Stack

### Frontend
```typescript
// Framework
Next.js 14+ (App Router)
TypeScript
React 18+

// UI & Styling
Tailwind CSS
shadcn/ui (component library)
Radix UI (primitives)

// State Management
TanStack Query (React Query) - Server state
Zustand or Jotai - Client state
React Hook Form - Forms

// Validation
Zod - Schema validation

// Authentication
NextAuth.js (Auth.js)

// Code Quality
ESLint
Prettier
TypeScript strict mode
```

### Backend
```typescript
// Option 1: Next.js API Routes (Recommended for MVP)
Next.js API Routes
TypeScript

// Option 2: Separate Backend (For Scale)
Express.js or FastAPI
TypeScript or Python

// Database
PostgreSQL (via Supabase or self-hosted)
Prisma ORM (TypeScript) or SQLAlchemy (Python)

// Caching
Redis (Upstash for serverless)

// Queue (for async tasks)
BullMQ or Inngest

// File Storage
Cloudflare R2 or AWS S3
```

### Infrastructure
```
Hosting:
- Frontend: Vercel
- Backend: Railway or Render
- Database: Supabase (managed) or self-hosted PostgreSQL

CDN: Cloudflare

Monitoring:
- Error Tracking: Sentry
- Analytics: PostHog or Mixpanel
- Logging: Axiom or LogRocket

LLM Integrations:
- OpenAI SDK
- Anthropic SDK
- Google AI SDK
```

---

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations (Teams)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  tags TEXT[], -- Array of tags
  is_archived BOOLEAN DEFAULT FALSE,
  current_version_id UUID, -- Reference to latest version
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompt Versions (Version Control)
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_version_id UUID REFERENCES prompt_versions(id), -- For branching
  created_by UUID REFERENCES users(id),
  change_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(prompt_id, version_number)
);

-- A/B Tests
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  variant_a_version_id UUID REFERENCES prompt_versions(id),
  variant_b_version_id UUID REFERENCES prompt_versions(id),
  traffic_split INTEGER DEFAULT 50, -- Percentage for variant A
  status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed, paused
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- A/B Test Results
CREATE TABLE ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ab_test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant VARCHAR(10) NOT NULL, -- 'A' or 'B'
  user_id UUID REFERENCES users(id),
  impressions INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,
  avg_tokens INTEGER,
  success_rate DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ab_test_id, variant, date)
);

-- Prompt Executions (Analytics)
CREATE TABLE prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version_id UUID REFERENCES prompt_versions(id),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  provider VARCHAR(50) NOT NULL, -- openai, anthropic, google
  model VARCHAR(100) NOT NULL, -- gpt-4, claude-3-opus, etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LLM Integrations (API Keys)
CREATE TABLE llm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- openai, anthropic, google
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  config JSONB, -- Provider-specific config
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

-- Folders (Organization)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_folder_id UUID REFERENCES folders(id), -- For nested folders
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompt-Folder Relationship
CREATE TABLE prompt_folders (
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, folder_id)
);

-- API Keys (for API access)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_prompts_organization ON prompts(organization_id);
CREATE INDEX idx_prompts_created_by ON prompts(created_by);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_executions_prompt ON prompt_executions(prompt_id);
CREATE INDEX idx_prompt_executions_date ON prompt_executions(created_at);
```

---

## API Design

### RESTful API Structure

```typescript
// Base URL: https://api.yourproduct.com/v1

// Authentication
POST   /auth/login
POST   /auth/register
POST   /auth/logout
GET    /auth/me

// Organizations
GET    /organizations
POST   /organizations
GET    /organizations/:id
PUT    /organizations/:id
DELETE /organizations/:id
GET    /organizations/:id/members
POST   /organizations/:id/members
DELETE /organizations/:id/members/:userId

// Prompts
GET    /prompts?organizationId=:id&folderId=:id&tag=:tag&search=:query
POST   /prompts
GET    /prompts/:id
PUT    /prompts/:id
DELETE /prompts/:id
POST   /prompts/:id/duplicate
POST   /prompts/:id/archive
POST   /prompts/:id/unarchive

// Prompt Versions
GET    /prompts/:id/versions
POST   /prompts/:id/versions
GET    /prompts/:id/versions/:versionId
POST   /prompts/:id/versions/:versionId/restore
GET    /prompts/:id/versions/:versionId/diff

// A/B Tests
GET    /ab-tests?organizationId=:id
POST   /ab-tests
GET    /ab-tests/:id
PUT    /ab-tests/:id
DELETE /ab-tests/:id
POST   /ab-tests/:id/start
POST   /ab-tests/:id/pause
POST   /ab-tests/:id/stop
GET    /ab-tests/:id/results

// Prompt Testing
POST   /prompts/:id/test
POST   /prompts/:id/versions/:versionId/test

// Analytics
GET    /analytics/prompts/:id?startDate=:date&endDate=:date
GET    /analytics/organization/:id?startDate=:date&endDate=:date
GET    /analytics/costs?organizationId=:id&startDate=:date&endDate=:date

// Folders
GET    /folders?organizationId=:id
POST   /folders
GET    /folders/:id
PUT    /folders/:id
DELETE /folders/:id

// Integrations
GET    /integrations?organizationId=:id
POST   /integrations
GET    /integrations/:id
PUT    /integrations/:id
DELETE /integrations/:id
POST   /integrations/:id/test

// API Keys
GET    /api-keys?organizationId=:id
POST   /api-keys
DELETE /api-keys/:id

// Export/Import
GET    /export?organizationId=:id&format=json|csv
POST   /import
```

### API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

---

## Core Features Implementation

### 1. Version Control System

```typescript
// Version control service
class PromptVersionService {
  async createVersion(
    promptId: string,
    content: string,
    userId: string,
    changeSummary?: string
  ) {
    // Get current version
    const currentVersion = await this.getLatestVersion(promptId);
    
    // Calculate diff
    const diff = currentVersion
      ? this.calculateDiff(currentVersion.content, content)
      : null;
    
    // Create new version
    const version = await db.promptVersion.create({
      data: {
        promptId,
        versionNumber: currentVersion
          ? currentVersion.versionNumber + 1
          : 1,
        content,
        parentVersionId: currentVersion?.id,
        createdBy: userId,
        changeSummary: changeSummary || this.generateSummary(diff),
      },
    });
    
    // Update prompt's current version
    await db.prompt.update({
      where: { id: promptId },
      data: { currentVersionId: version.id },
    });
    
    return version;
  }
  
  async getVersions(promptId: string) {
    return db.promptVersion.findMany({
      where: { promptId },
      orderBy: { versionNumber: 'desc' },
      include: { createdBy: { select: { name: true, email: true } } },
    });
  }
  
  async restoreVersion(promptId: string, versionId: string, userId: string) {
    const version = await db.promptVersion.findUnique({
      where: { id: versionId },
    });
    
    if (!version) throw new Error('Version not found');
    
    // Create new version from old version
    return this.createVersion(
      promptId,
      version.content,
      userId,
      `Restored from version ${version.versionNumber}`
    );
  }
  
  calculateDiff(oldContent: string, newContent: string) {
    // Use diff library (e.g., diff-match-patch)
    // Return structured diff
  }
}
```

### 2. A/B Testing Framework

```typescript
class ABTestingService {
  async createTest(
    promptId: string,
    variantA: string,
    variantB: string,
    userId: string
  ) {
    // Create versions for both variants
    const versionA = await promptVersionService.createVersion(
      promptId,
      variantA,
      userId,
      'A/B Test - Variant A'
    );
    
    const versionB = await promptVersionService.createVersion(
      promptId,
      variantB,
      userId,
      'A/B Test - Variant B'
    );
    
    // Create A/B test
    const test = await db.abTest.create({
      data: {
        promptId,
        name: `A/B Test - ${new Date().toISOString()}`,
        variantAVersionId: versionA.id,
        variantBVersionId: versionB.id,
        trafficSplit: 50,
        status: 'draft',
        createdBy: userId,
      },
    });
    
    return test;
  }
  
  async routeRequest(testId: string, userId: string): Promise<'A' | 'B'> {
    const test = await db.abTest.findUnique({
      where: { id: testId },
      include: { prompt: true },
    });
    
    if (!test || test.status !== 'running') {
      // Return default or latest version
      return 'A';
    }
    
    // Consistent hashing based on user ID
    const hash = this.hashUserId(userId);
    const variant = hash % 100 < test.trafficSplit ? 'A' : 'B';
    
    return variant;
  }
  
  async trackExecution(
    testId: string,
    variant: 'A' | 'B',
    metrics: {
      success: boolean;
      latency: number;
      tokens: number;
    }
  ) {
    // Update test results
    await db.abTestResult.upsert({
      where: {
        abTestId_variant_date: {
          abTestId: testId,
          variant,
          date: new Date().toISOString().split('T')[0],
        },
      },
      update: {
        impressions: { increment: 1 },
        completions: metrics.success ? { increment: 1 } : undefined,
        avgLatencyMs: this.calculateAverage(/* ... */),
        avgTokens: this.calculateAverage(/* ... */),
        successRate: this.calculateSuccessRate(/* ... */),
      },
      create: {
        abTestId: testId,
        variant,
        impressions: 1,
        completions: metrics.success ? 1 : 0,
        avgLatencyMs: metrics.latency,
        avgTokens: metrics.tokens,
        successRate: metrics.success ? 100 : 0,
        date: new Date().toISOString().split('T')[0],
      },
    });
  }
  
  async determineWinner(testId: string) {
    const results = await db.abTestResult.findMany({
      where: { abTestId: testId },
    });
    
    // Statistical analysis (t-test, chi-square, etc.)
    const analysis = this.performStatisticalAnalysis(results);
    
    if (analysis.isSignificant) {
      return analysis.winner; // 'A' or 'B'
    }
    
    return null; // No clear winner yet
  }
}
```

### 3. LLM Integration Service

```typescript
// Provider interface
interface LLMProvider {
  execute(
    prompt: string,
    config: LLMConfig
  ): Promise<LLMResponse>;
}

// OpenAI implementation
class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async execute(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: config.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });
      
      const latency = Date.now() - startTime;
      
      return {
        content: response.choices[0].message.content,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        latency,
        cost: this.calculateCost(response.usage, config.model),
        success: true,
      };
    } catch (error) {
      return {
        content: null,
        error: error.message,
        success: false,
        latency: Date.now() - startTime,
      };
    }
  }
  
  calculateCost(usage: any, model: string): number {
    // Pricing per 1K tokens (example)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };
    
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}

// Factory
class LLMProviderFactory {
  getProvider(provider: string, apiKey: string): LLMProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'anthropic':
        return new AnthropicProvider(apiKey);
      case 'google':
        return new GoogleProvider(apiKey);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

// Service
class LLMService {
  async executePrompt(
    promptId: string,
    input: string,
    userId: string,
    organizationId: string
  ) {
    // Get prompt and integration
    const prompt = await db.prompt.findUnique({ where: { id: promptId } });
    const integration = await db.llmIntegration.findFirst({
      where: { organizationId, isActive: true },
    });
    
    if (!integration) throw new Error('No active integration found');
    
    // Decrypt API key
    const apiKey = this.decryptAPIKey(integration.apiKeyEncrypted);
    
    // Get provider
    const provider = LLMProviderFactory.getProvider(
      integration.provider,
      apiKey
    );
    
    // Replace variables in prompt
    const processedPrompt = this.processVariables(
      prompt.content,
      input
    );
    
    // Execute
    const response = await provider.execute(processedPrompt, {
      model: integration.config.model,
      temperature: integration.config.temperature,
    });
    
    // Log execution
    await db.promptExecution.create({
      data: {
        promptId,
        promptVersionId: prompt.currentVersionId,
        userId,
        organizationId,
        provider: integration.provider,
        model: integration.config.model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
        costUsd: response.cost,
        latencyMs: response.latency,
        success: response.success,
        errorMessage: response.error,
      },
    });
    
    return response;
  }
  
  processVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
```

### 4. Cost Tracking & Analytics

```typescript
class AnalyticsService {
  async getPromptAnalytics(
    promptId: string,
    startDate: Date,
    endDate: Date
  ) {
    const executions = await db.promptExecution.findMany({
      where: {
        promptId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    
    return {
      totalExecutions: executions.length,
      successRate:
        executions.filter((e) => e.success).length / executions.length,
      avgLatency: this.average(executions.map((e) => e.latencyMs)),
      totalTokens: executions.reduce((sum, e) => sum + e.totalTokens, 0),
      totalCost: executions.reduce((sum, e) => sum + e.costUsd, 0),
      byProvider: this.groupBy(executions, 'provider'),
      byModel: this.groupBy(executions, 'model'),
      dailyTrend: this.getDailyTrend(executions),
    };
  }
  
  async getCostAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const executions = await db.promptExecution.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    
    return {
      totalCost: executions.reduce((sum, e) => sum + e.costUsd, 0),
      byPrompt: this.groupByCost(executions, 'promptId'),
      byProvider: this.groupByCost(executions, 'provider'),
      dailyCost: this.getDailyCost(executions),
      topExpensivePrompts: this.getTopExpensive(executions, 10),
    };
  }
}
```

---

## Security Implementation

### API Key Encryption

```typescript
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    // Get key from environment
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      iv
    );
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

// Middleware
export async function rateLimit(req: Request) {
  const identifier = req.headers.get('x-api-key') || 'anonymous';
  const { success, limit, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, remaining };
}
```

---

## Development Workflow

### Project Structure

```
prompt-manage/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── api/                 # API server (if separate)
│       ├── src/
│       └── package.json
├── packages/
│   ├── db/                  # Database schema & Prisma
│   ├── ui/                  # Shared UI components
│   └── shared/              # Shared utilities
├── packages/
│   └── sdk/                 # Public SDK
├── docs/                    # Documentation
└── package.json
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Encryption
ENCRYPTION_KEY=...

# Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# LLM Providers (for testing)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...

# File Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

---

## Testing Strategy

### Unit Tests
```typescript
// Example: Version control service test
describe('PromptVersionService', () => {
  it('should create a new version', async () => {
    const version = await versionService.createVersion(
      'prompt-1',
      'New content',
      'user-1'
    );
    
    expect(version.versionNumber).toBe(1);
    expect(version.content).toBe('New content');
  });
});
```

### Integration Tests
```typescript
// Example: API endpoint test
describe('POST /api/prompts', () => {
  it('should create a prompt', async () => {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Prompt',
        content: 'Test content',
      }),
    });
    
    expect(response.status).toBe(201);
  });
});
```

### E2E Tests
```typescript
// Example: Playwright test
test('user can create and test a prompt', async ({ page }) => {
  await page.goto('/prompts');
  await page.click('text=New Prompt');
  await page.fill('[name="title"]', 'Test Prompt');
  await page.fill('[name="content"]', 'Test content');
  await page.click('text=Save');
  await page.click('text=Test');
  await expect(page.locator('.test-result')).toBeVisible();
});
```

---

## Deployment Checklist

- [ ] Database migrations run
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] CDN configured
- [ ] Monitoring set up (Sentry, etc.)
- [ ] Analytics configured
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] API documentation published
- [ ] Error tracking active

---

*This guide provides the technical foundation for building your prompt management SaaS.*

