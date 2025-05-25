# Email Template Management System
## Complete Implementation Guide

---

## 1. Email Template Architecture

### 1.1 Database Schema

```sql
-- Email template categories
CREATE TYPE template_category AS ENUM (
  'confirmation',
  'reminder', 
  'announcement',
  'cancellation',
  'refund',
  'custom'
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES users(id),
  function_id UUID REFERENCES functions(id), -- Optional, for function-specific
  name TEXT NOT NULL,
  category template_category NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available merge variables
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  preview_data JSONB, -- Sample data for preview
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template usage tracking
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  campaign_id UUID,
  sent_count INTEGER DEFAULT 0,
  open_rate DECIMAL,
  click_rate DECIMAL,
  last_used TIMESTAMP
);
```

### 1.2 Default Templates

```typescript
// lib/email/defaultTemplates.ts

export const DEFAULT_TEMPLATES = {
  confirmation: {
    name: 'Registration Confirmation',
    category: 'confirmation',
    subject: 'Confirmation - {{function_name}}',
    body_html: `
      <h2>Registration Confirmed!</h2>
      <p>Dear {{attendee_name}},</p>
      <p>Thank you for registering for {{function_name}}.</p>
      
      <h3>Your Details:</h3>
      <ul>
        <li>Confirmation Number: {{confirmation_number}}</li>
        <li>Total Amount: ${{total_amount}}</li>
      </ul>
      
      <h3>Events:</h3>
      {{#each events}}
        <div style="margin: 20px 0;">
          <h4>{{name}}</h4>
          <p>{{date}} at {{time}}</p>
          <p>{{venue}}</p>
        </div>
      {{/each}}
      
      <p>Your tickets are attached to this email.</p>
    `,
    variables: [
      'attendee_name',
      'function_name', 
      'confirmation_number',
      'total_amount',
      'events'
    ]
  },
  
  reminder: {
    name: 'Event Reminder',
    category: 'reminder',
    subject: 'Reminder: {{function_name}} - {{days_until}} days away',
    body_html: `
      <h2>Event Reminder</h2>
      <p>Dear {{attendee_name}},</p>
      <p>This is a friendly reminder that {{function_name}} is coming up in {{days_until}} days.</p>
      
      <h3>Your Schedule:</h3>
      {{#each attendee_events}}
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0;">
          <h4>{{event_name}}</h4>
          <p><strong>Date:</strong> {{event_date}}</p>
          <p><strong>Time:</strong> {{event_time}}</p>
          <p><strong>Location:</strong> {{venue}}</p>
          <p><strong>Dress Code:</strong> {{dress_code}}</p>
        </div>
      {{/each}}
      
      <h3>Important Information:</h3>
      <ul>
        <li>Please arrive 15 minutes early</li>
        <li>Bring your ticket (printed or mobile)</li>
        <li>Photo ID required for entry</li>
      </ul>
    `
  },
  
  announcement: {
    name: 'Event Announcement',
    category: 'announcement',
    subject: '{{announcement_type}}: {{function_name}}',
    body_html: `
      <h2>{{announcement_type}}</h2>
      <p>Dear {{attendee_name}},</p>
      
      {{announcement_content}}
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `
  }
}
```

---

## 2. Email Template Manager Component

### 2.1 Template List View

```typescript
// components/organizer/email/EmailTemplateManager.tsx

interface EmailTemplateManagerProps {
  functionId?: string
  organizerId: string
}

export function EmailTemplateManager({ functionId, organizerId }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage your email templates for automated communications
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Templates
        </Button>
        {Object.values(TemplateCategory).map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {formatCategoryName(category)}
          </Button>
        ))}
      </div>
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={() => handleEdit(template)}
            onDuplicate={() => handleDuplicate(template)}
            onDelete={() => handleDelete(template)}
            onPreview={() => handlePreview(template)}
          />
        ))}
      </div>
      
      {/* Template Editor Dialog */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}
```

### 2.2 Template Card Component

```typescript
// components/organizer/email/TemplateCard.tsx

interface TemplateCardProps {
  template: EmailTemplate
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPreview: () => void
}

export function TemplateCard({ 
  template, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onPreview 
}: TemplateCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {formatCategoryName(template.category)}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          Subject: {template.subject}
        </p>
        <p className="text-sm line-clamp-3">
          {stripHtml(template.body_html)}
        </p>
        
        {template.usage && (
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Sent: {template.usage.sent_count}</span>
            {template.usage.open_rate && (
              <span>Opens: {template.usage.open_rate}%</span>
            )}
            {template.usage.last_used && (
              <span>Last used: {formatRelative(template.usage.last_used)}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 3. Template Editor

### 3.1 Rich Template Editor Component

```typescript
// components/organizer/email/TemplateEditor.tsx

interface TemplateEditorProps {
  template?: EmailTemplate | null
  onSave: (template: EmailTemplate) => Promise<void>
  onClose: () => void
}

export function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: template?.name || '',
    category: template?.category || 'custom',
    subject: template?.subject || '',
    body_html: template?.body_html || '',
    body_text: template?.body_text || '',
    variables: template?.variables || []
  })
  
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  
  // Available merge variables based on category
  const availableVariables = useMemo(() => {
    const baseVars = [
      { key: 'attendee_name', label: 'Attendee Name', sample: 'John Smith' },
      { key: 'function_name', label: 'Function Name', sample: 'Grand Installation 2025' },
      { key: 'confirmation_number', label: 'Confirmation #', sample: 'CONF-12345' }
    ]
    
    const categoryVars = {
      confirmation: [
        { key: 'total_amount', label: 'Total Amount', sample: '250.00' },
        { key: 'payment_method', label: 'Payment Method', sample: 'Visa ***1234' }
      ],
      reminder: [
        { key: 'days_until', label: 'Days Until Event', sample: '7' },
        { key: 'event_date', label: 'Event Date', sample: 'March 15, 2025' }
      ],
      announcement: [
        { key: 'announcement_type', label: 'Announcement Type', sample: 'Important Update' },
        { key: 'announcement_content', label: 'Content', sample: 'Event details...' }
      ]
    }
    
    return [...baseVars, ...(categoryVars[formData.category] || [])]
  }, [formData.category])
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="flex-1">
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Main Editor */}
              <div className="col-span-2 space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TemplateCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {formatCategoryName(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Use {{variables}} for dynamic content"
                  />
                </div>
                
                <div className="flex-1">
                  <Label>Email Content</Label>
                  <EmailRichTextEditor
                    value={formData.body_html}
                    onChange={(html, text) => setFormData({ 
                      ...formData, 
                      body_html: html,
                      body_text: text 
                    })}
                    variables={availableVariables}
                  />
                </div>
              </div>
              
              {/* Variable Helper */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Available Variables</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to insert into subject or content
                  </p>
                  <div className="space-y-2">
                    {availableVariables.map(variable => (
                      <VariableButton
                        key={variable.key}
                        variable={variable}
                        onClick={() => insertVariable(variable.key)}
                      />
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Conditional Blocks</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertConditional('if')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      If Statement
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertConditional('each')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      For Each Loop
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Template Tips</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use {{variable}} for simple replacements</li>
                    <li>• Use {{#if condition}} for conditionals</li>
                    <li>• Use {{#each items}} for lists</li>
                    <li>• Always provide text version</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <EmailPreviewPanel
              template={formData}
              previewData={previewData}
              onPreviewDataChange={setPreviewData}
              availableVariables={availableVariables}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => handleSave()}>
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.2 Email Rich Text Editor

```typescript
// components/organizer/email/EmailRichTextEditor.tsx

interface EmailRichTextEditorProps {
  value: string
  onChange: (html: string, text: string) => void
  variables: Variable[]
}

export function EmailRichTextEditor({ value, onChange, variables }: EmailRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      Highlight,
      // Custom extension for variables
      VariableExtension
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      onChange(html, text)
    }
  })
  
  if (!editor) return null
  
  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} variables={variables} />
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] p-4 prose max-w-none"
      />
    </div>
  )
}
```

---

## 4. Template Usage & Analytics

### 4.1 Template Analytics Component

```typescript
// components/organizer/email/TemplateAnalytics.tsx

interface TemplateAnalyticsProps {
  templateId: string
}

export function TemplateAnalytics({ templateId }: TemplateAnalyticsProps) {
  const { data: analytics } = useTemplateAnalytics(templateId)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="Total Sent"
            value={analytics.totalSent}
            icon={Send}
          />
          <MetricCard
            title="Open Rate"
            value={`${analytics.openRate}%`}
            icon={Eye}
            trend={analytics.openRateTrend}
          />
          <MetricCard
            title="Click Rate"
            value={`${analytics.clickRate}%`}
            icon={MousePointer}
            trend={analytics.clickRateTrend}
          />
          <MetricCard
            title="Unsubscribe Rate"
            value={`${analytics.unsubscribeRate}%`}
            icon={UserX}
            trend={analytics.unsubscribeTrend}
          />
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">Performance Over Time</h4>
          <EmailPerformanceChart data={analytics.timeSeriesData} />
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">Recent Campaigns</h4>
          <CampaignList campaigns={analytics.recentCampaigns} />
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 5. Email Scheduling System

### 5.1 Email Scheduler Component

```typescript
// components/organizer/email/EmailScheduler.tsx

interface EmailSchedulerProps {
  functionId: string
  templates: EmailTemplate[]
}

export function EmailScheduler({ functionId, templates }: EmailSchedulerProps) {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [showScheduler, setShowScheduler] = useState(false)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Automated Emails</h3>
        <Button onClick={() => setShowScheduler(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Email
        </Button>
      </div>
      
      <div className="space-y-2">
        {scheduledEmails.map(email => (
          <ScheduledEmailCard
            key={email.id}
            email={email}
            onEdit={(id) => handleEdit(id)}
            onDelete={(id) => handleDelete(id)}
            onPause={(id) => handlePause(id)}
          />
        ))}
      </div>
      
      {showScheduler && (
        <EmailSchedulerModal
          functionId={functionId}
          templates={templates}
          onSchedule={handleSchedule}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  )
}

interface EmailSchedulerModalProps {
  functionId: string
  templates: EmailTemplate[]
  onSchedule: (schedule: EmailSchedule) => Promise<void>
  onClose: () => void
}

export function EmailSchedulerModal({ 
  functionId, 
  templates, 
  onSchedule, 
  onClose 
}: EmailSchedulerModalProps) {
  const [schedule, setSchedule] = useState<EmailSchedule>({
    templateId: '',
    triggerType: 'before_event',
    triggerValue: 7,
    triggerUnit: 'days',
    filters: {
      events: [],
      ticketTypes: []
    }
  })
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Automated Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Email Template</Label>
            <Select 
              value={schedule.templateId}
              onValueChange={(value) => setSchedule({ ...schedule, templateId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>When to Send</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={schedule.triggerValue}
                onChange={(e) => setSchedule({ 
                  ...schedule, 
                  triggerValue: parseInt(e.target.value) 
                })}
                className="w-20"
              />
              <Select 
                value={schedule.triggerUnit}
                onValueChange={(value) => setSchedule({ ...schedule, triggerUnit: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={schedule.triggerType}
                onValueChange={(value) => setSchedule({ ...schedule, triggerType: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_event">Before Event</SelectItem>
                  <SelectItem value="after_registration">After Registration</SelectItem>
                  <SelectItem value="after_payment">After Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Filter Recipients (Optional)</Label>
            <RecipientFilters
              filters={schedule.filters}
              onChange={(filters) => setSchedule({ ...schedule, filters })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => handleSchedule()}>
            Schedule Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 6. Integration with Resend

### 6.1 Enhanced Resend Service

```typescript
// lib/services/enhancedResendService.ts

export class EnhancedResendService {
  private resend: Resend
  
  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }
  
  async sendTemplatedEmail(params: TemplatedEmailParams): Promise<EmailResult> {
    // 1. Load template
    const template = await this.loadTemplate(params.templateId)
    
    // 2. Merge variables
    const subject = this.mergeVariables(template.subject, params.data)
    const html = this.mergeVariables(template.body_html, params.data)
    const text = this.mergeVariables(template.body_text, params.data)
    
    // 3. Send email
    const result = await this.resend.emails.send({
      from: params.from || 'LodgeTix <noreply@lodgetix.com>',
      to: params.to,
      subject,
      html,
      text,
      attachments: params.attachments,
      tags: {
        template_id: params.templateId,
        function_id: params.functionId,
        ...params.tags
      }
    })
    
    // 4. Track usage
    await this.trackUsage(params.templateId, result)
    
    return result
  }
  
  async sendBulkTemplatedEmails(params: BulkTemplatedEmailParams): Promise<BulkEmailResult> {
    const template = await this.loadTemplate(params.templateId)
    
    // Process in batches
    const batches = chunk(params.recipients, 100)
    const results = []
    
    for (const batch of batches) {
      const emails = batch.map(recipient => ({
        from: params.from || 'LodgeTix <noreply@lodgetix.com>',
        to: recipient.email,
        subject: this.mergeVariables(template.subject, recipient.data),
        html: this.mergeVariables(template.body_html, recipient.data),
        text: this.mergeVariables(template.body_text, recipient.data),
        tags: {
          template_id: params.templateId,
          campaign_id: params.campaignId,
          ...params.tags
        }
      }))
      
      const batchResult = await this.resend.batch.send(emails)
      results.push(batchResult)
    }
    
    // Track campaign
    await this.trackCampaign(params.campaignId, results)
    
    return {
      campaignId: params.campaignId,
      totalSent: params.recipients.length,
      results
    }
  }
  
  private mergeVariables(content: string, data: Record<string, any>): string {
    // Handle simple variables
    let result = content
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, String(value))
    })
    
    // Handle conditionals (simplified)
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return data[variable] ? content : ''
    })
    
    // Handle loops (simplified)
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, variable, content) => {
      const items = data[variable]
      if (!Array.isArray(items)) return ''
      
      return items.map(item => {
        let itemContent = content
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
          itemContent = itemContent.replace(regex, String(value))
        })
        return itemContent
      }).join('')
    })
    
    return result
  }
}
```

---

## Implementation Priorities

1. **Phase 1: Core Template System**
   - Basic template CRUD
   - Simple variable replacement
   - Preview functionality

2. **Phase 2: Advanced Features**
   - Rich text editor
   - Conditional logic
   - Template analytics

3. **Phase 3: Automation**
   - Email scheduling
   - Trigger-based sending
   - Campaign management

4. **Phase 4: Optimization**
   - A/B testing
   - Personalization
   - Advanced analytics