# Customer Service Components Specification
## Detailed Implementation Guide

---

## 1. Ticket Re-issue System

### 1.1 TicketReissueModal Component

```typescript
// components/organizer/tickets/TicketReissueModal.tsx

interface TicketReissueModalProps {
  ticket: {
    id: string
    attendeeName: string
    eventName: string
    ticketType: string
    currentQRCode: string
  }
  registration: {
    id: string
    confirmationNumber: string
    customerEmail: string
  }
  onReissue: (data: ReissueData) => Promise<void>
  onClose: () => void
}

interface ReissueData {
  ticketId: string
  reason: string
  generateNewQR: boolean
  sendEmail: boolean
  emailOverride?: string
  internalNote: string
  notifyAttendee: boolean
}

export function TicketReissueModal({ ticket, registration, onReissue, onClose }: TicketReissueModalProps) {
  const [reason, setReason] = useState<string>('')
  const [generateNewQR, setGenerateNewQR] = useState(true)
  const [sendEmail, setSendEmail] = useState(true)
  const [emailOverride, setEmailOverride] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const commonReasons = [
    'Lost ticket',
    'Email not received',
    'QR code not scanning',
    'Name change',
    'Device change',
    'Other'
  ]

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-issue Ticket</DialogTitle>
          <DialogDescription>
            Re-issuing ticket for {ticket.attendeeName} - {ticket.eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for Re-issue</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {commonReasons.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="new-qr" 
                checked={generateNewQR}
                onCheckedChange={setGenerateNewQR}
              />
              <Label htmlFor="new-qr">Generate new QR code (invalidates old one)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-email" 
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
              <Label htmlFor="send-email">Send new ticket via email</Label>
            </div>
          </div>

          {sendEmail && (
            <div>
              <Label>Email Address</Label>
              <Input 
                placeholder={registration.customerEmail}
                value={emailOverride}
                onChange={(e) => setEmailOverride(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave blank to use original email
              </p>
            </div>
          )}

          <div>
            <Label>Internal Note</Label>
            <Textarea 
              placeholder="Add any internal notes about this re-issue..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleReissue}
            disabled={!reason || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Re-issue Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 1.2 Ticket Re-issue Service

```typescript
// lib/services/ticketReissueService.ts

export class TicketReissueService {
  async reissueTicket(data: ReissueData): Promise<ReissueResult> {
    // 1. Create audit log entry
    await this.logReissue(data)
    
    // 2. Generate new QR if requested
    let newQRCode: string | undefined
    if (data.generateNewQR) {
      // Invalidate old QR
      await supabase.rpc('sp_invalidate_ticket_qr', { 
        ticket_id: data.ticketId 
      })
      
      // Generate new QR
      newQRCode = await generateQRCode({
        ticketId: data.ticketId,
        version: Date.now(), // Version tracking
        type: 'reissued'
      })
      
      // Update ticket record
      await supabase.rpc('sp_update_ticket_qr', {
        ticket_id: data.ticketId,
        qr_code: newQRCode
      })
    }
    
    // 3. Send email if requested
    if (data.sendEmail) {
      const ticket = await this.getTicketDetails(data.ticketId)
      const pdfBuffer = await generateTicketPDF({
        ...ticket,
        qrCode: newQRCode || ticket.qrCode,
        reissued: true,
        reissueDate: new Date()
      })
      
      await resendService.send({
        to: data.emailOverride || ticket.customerEmail,
        subject: `Re-issued Ticket - ${ticket.eventName}`,
        template: 'ticket-reissue',
        attachments: [{
          filename: `ticket-${ticket.confirmationNumber}.pdf`,
          content: pdfBuffer
        }],
        data: {
          attendeeName: ticket.attendeeName,
          eventName: ticket.eventName,
          reason: data.reason
        }
      })
    }
    
    return {
      success: true,
      newQRCode,
      emailSent: data.sendEmail
    }
  }
}
```

---

## 2. Refund Processing System

### 2.1 RefundModal Component

```typescript
// components/organizer/financial/RefundModal.tsx

interface RefundModalProps {
  registration: {
    id: string
    confirmationNumber: string
    totalAmount: number
    stripePaymentIntentId: string
    attendees: AttendeeWithTickets[]
  }
  stripeAccountId: string
  onRefund: (refund: RefundRequest) => Promise<void>
  onClose: () => void
}

export function RefundModal({ registration, stripeAccountId, onRefund, onClose }: RefundModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [selectedItems, setSelectedItems] = useState<RefundItem[]>([])
  const [refundAmount, setRefundAmount] = useState(registration.totalAmount)
  const [reason, setReason] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  
  const calculateRefundAmount = () => {
    if (refundType === 'full') return registration.totalAmount
    
    return selectedItems.reduce((sum, item) => sum + item.amount, 0)
  }
  
  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Registration #{registration.confirmationNumber}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={refundType} onValueChange={setRefundType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full">Full Refund</TabsTrigger>
            <TabsTrigger value="partial">Partial Refund</TabsTrigger>
          </TabsList>
          
          <TabsContent value="full">
            <Alert>
              <AlertDescription>
                This will refund the entire amount of ${registration.totalAmount.toFixed(2)} 
                and cancel all tickets.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="partial">
            <div className="space-y-4">
              <Label>Select items to refund:</Label>
              {registration.attendees.map(attendee => (
                <Card key={attendee.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{attendee.name}</p>
                        {attendee.tickets.map(ticket => (
                          <div key={ticket.id} className="flex items-center gap-2 mt-1">
                            <Checkbox
                              checked={selectedItems.some(i => i.ticketId === ticket.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItems([...selectedItems, {
                                    ticketId: ticket.id,
                                    amount: ticket.price,
                                    description: `${ticket.eventName} - ${ticket.ticketType}`
                                  }])
                                } else {
                                  setSelectedItems(selectedItems.filter(i => i.ticketId !== ticket.id))
                                }
                              }}
                            />
                            <span className="text-sm">
                              {ticket.eventName} - {ticket.ticketType}
                            </span>
                            <span className="text-sm font-medium ml-auto">
                              ${ticket.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Refund Amount:</span>
                  <span>${calculateRefundAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4">
          <div>
            <Label>Reason for Refund</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event_cancelled">Event Cancelled</SelectItem>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="duplicate_registration">Duplicate Registration</SelectItem>
                <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="send-refund-email" 
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
            <Label htmlFor="send-refund-email">Send refund confirmation email</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive"
            onClick={() => handleRefund()}
            disabled={!reason || (refundType === 'partial' && selectedItems.length === 0)}
          >
            Process Refund (${calculateRefundAmount().toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 2.2 Refund Processing Service

```typescript
// lib/services/refundService.ts

export class RefundService {
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      // 1. Calculate platform fee portion
      const platformFeeRefund = request.amount * 0.025 // 2.5%
      
      // 2. Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: request.stripePaymentIntentId,
        amount: Math.round(request.amount * 100), // Convert to cents
        reason: this.mapRefundReason(request.reason),
        metadata: {
          registrationId: request.registrationId,
          processedBy: request.processedBy,
          internalReason: request.reason
        }
      }, {
        stripeAccount: request.stripeAccountId
      })
      
      // 3. Update database
      await supabase.rpc('sp_process_refund', {
        registration_id: request.registrationId,
        refund_amount: request.amount,
        stripe_refund_id: refund.id,
        refund_items: request.items,
        reason: request.reason,
        processed_by: request.processedBy
      })
      
      // 4. Send confirmation email
      if (request.sendEmail) {
        await this.sendRefundEmail(request, refund)
      }
      
      // 5. Update ticket statuses
      if (request.type === 'full') {
        await this.cancelAllTickets(request.registrationId)
      } else {
        await this.cancelSelectedTickets(request.items.map(i => i.ticketId))
      }
      
      return {
        success: true,
        refundId: refund.id,
        amount: request.amount,
        status: refund.status
      }
    } catch (error) {
      // Log error and return failure
      console.error('Refund failed:', error)
      throw new RefundError('Failed to process refund', error)
    }
  }
}
```

---

## 3. Bulk Email System

### 3.1 BulkEmailComposer Component

```typescript
// components/organizer/communications/BulkEmailComposer.tsx

interface BulkEmailComposerProps {
  functionId: string
  childEvents: ChildEvent[]
  onSend: (campaign: EmailCampaign) => Promise<void>
}

export function BulkEmailComposer({ functionId, childEvents, onSend }: BulkEmailComposerProps) {
  const [recipients, setRecipients] = useState<RecipientFilters>({
    allAttendees: true,
    byEvent: [],
    byTicketType: [],
    byStatus: ['confirmed']
  })
  const [template, setTemplate] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [schedule, setSchedule] = useState<Date | null>(null)
  
  // Rich text editor ref
  const editorRef = useRef<Editor>(null)
  
  // Available merge tags
  const mergeTags = [
    '{{attendee_name}}',
    '{{event_name}}',
    '{{confirmation_number}}',
    '{{event_date}}',
    '{{venue_name}}',
    '{{ticket_type}}'
  ]
  
  return (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={recipients.allAttendees ? 'all' : 'filtered'}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All attendees ({totalAttendees})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="filtered" id="filtered" />
              <Label htmlFor="filtered">Filter recipients</Label>
            </div>
          </RadioGroup>
          
          {!recipients.allAttendees && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>By Event</Label>
                <div className="space-y-2 mt-2">
                  {childEvents.map(event => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={recipients.byEvent.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRecipients({
                              ...recipients,
                              byEvent: [...recipients.byEvent, event.id]
                            })
                          } else {
                            setRecipients({
                              ...recipients,
                              byEvent: recipients.byEvent.filter(id => id !== event.id)
                            })
                          }
                        }}
                      />
                      <Label>{event.name} ({event.attendeeCount} attendees)</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Total Recipients: {calculateRecipientCount()}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Content */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank Email</SelectItem>
                <SelectItem value="reminder">Event Reminder</SelectItem>
                <SelectItem value="update">Event Update</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Subject Line</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Email Content</Label>
              <div className="flex gap-2">
                {mergeTags.map(tag => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => insertMergeTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
            <RichTextEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              placeholder="Type your email content..."
            />
          </div>
          
          <div>
            <Label>Schedule Send (Optional)</Label>
            <DateTimePicker
              value={schedule}
              onChange={setSchedule}
              minDate={new Date()}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to send immediately
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailPreview
            subject={subject}
            content={content}
            sampleData={getSampleAttendeeData()}
          />
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Save as Draft</Button>
        <Button 
          onClick={handleSend}
          disabled={!subject || !content || calculateRecipientCount() === 0}
        >
          {schedule ? `Schedule Send (${format(schedule, 'PPp')})` : 'Send Now'}
        </Button>
      </div>
    </div>
  )
}
```

### 3.2 Email Campaign Service

```typescript
// lib/services/emailCampaignService.ts

export class EmailCampaignService {
  async sendBulkEmail(campaign: EmailCampaign): Promise<CampaignResult> {
    // 1. Get recipient list
    const recipients = await this.getRecipients(campaign.filters)
    
    // 2. Create campaign record
    const campaignId = await supabase.rpc('sp_create_email_campaign', {
      function_id: campaign.functionId,
      subject: campaign.subject,
      content: campaign.content,
      recipient_count: recipients.length,
      scheduled_for: campaign.scheduledFor,
      created_by: campaign.createdBy
    })
    
    // 3. Process in batches
    const batchSize = 100
    const batches = chunk(recipients, batchSize)
    
    for (const batch of batches) {
      const emails = batch.map(recipient => ({
        to: recipient.email,
        subject: this.mergeTags(campaign.subject, recipient),
        html: this.mergeTags(campaign.content, recipient),
        tags: {
          campaign_id: campaignId,
          function_id: campaign.functionId,
          event_id: recipient.eventId
        }
      }))
      
      if (campaign.scheduledFor) {
        // Queue for later
        await this.queueEmails(emails, campaign.scheduledFor)
      } else {
        // Send immediately
        await resend.batch.send(emails)
      }
    }
    
    return {
      campaignId,
      recipientCount: recipients.length,
      status: campaign.scheduledFor ? 'scheduled' : 'sent'
    }
  }
  
  private mergeTags(content: string, data: RecipientData): string {
    return content
      .replace(/{{attendee_name}}/g, data.attendeeName)
      .replace(/{{event_name}}/g, data.eventName)
      .replace(/{{confirmation_number}}/g, data.confirmationNumber)
      .replace(/{{event_date}}/g, format(data.eventDate, 'PPP'))
      .replace(/{{venue_name}}/g, data.venueName)
      .replace(/{{ticket_type}}/g, data.ticketType)
  }
}
```

---

## 4. Print Management System

### 4.1 PrintManager Component

```typescript
// components/organizer/print/PrintManager.tsx

interface PrintManagerProps {
  functionId: string
  eventId?: string
  registrations: Registration[]
}

export function PrintManager({ functionId, eventId, registrations }: PrintManagerProps) {
  const [printType, setPrintType] = useState<'tickets' | 'badges' | 'manifest'>('tickets')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    format: 'A4',
    orientation: 'portrait',
    includeQR: true,
    includeDietary: false,
    groupByTable: false
  })
  
  const handlePrint = async () => {
    const items = selectedItems.length > 0 
      ? registrations.filter(r => selectedItems.includes(r.id))
      : registrations
      
    switch (printType) {
      case 'tickets':
        await printTickets(items, printSettings)
        break
      case 'badges':
        await printBadges(items, printSettings)
        break
      case 'manifest':
        await printManifest(items, printSettings)
        break
    }
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={printType} onValueChange={setPrintType}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="manifest">Attendee List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets">
          <TicketPrintSettings 
            settings={printSettings}
            onChange={setPrintSettings}
          />
        </TabsContent>
        
        <TabsContent value="badges">
          <BadgePrintSettings 
            settings={printSettings}
            onChange={setPrintSettings}
          />
        </TabsContent>
        
        <TabsContent value="manifest">
          <ManifestPrintSettings 
            settings={printSettings}
            onChange={setPrintSettings}
          />
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Items to Print</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendeeSelectionTable
            registrations={registrations}
            selected={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handlePreview()}>
          Preview
        </Button>
        <Button onClick={handlePrint}>
          Print {selectedItems.length || registrations.length} Items
        </Button>
      </div>
    </div>
  )
}
```

---

## 5. Invoice Generation System

### 5.1 InvoiceGenerator Component

```typescript
// components/organizer/financial/InvoiceGenerator.tsx

interface InvoiceGeneratorProps {
  registration: Registration
  functionDetails: Function
  organizationDetails: Organization
}

export function InvoiceGenerator({ 
  registration, 
  functionDetails, 
  organizationDetails 
}: InvoiceGeneratorProps) {
  const [invoiceType, setInvoiceType] = useState<'tax_invoice' | 'receipt'>('tax_invoice')
  const [includeGST, setIncludeGST] = useState(true)
  const [customMessage, setCustomMessage] = useState('')
  
  const generateInvoice = async () => {
    const invoiceData: InvoiceData = {
      type: invoiceType,
      invoiceNumber: generateInvoiceNumber(registration),
      date: new Date(),
      
      // From
      from: {
        name: organizationDetails.name,
        abn: organizationDetails.abn,
        address: organizationDetails.address,
        email: organizationDetails.email,
        phone: organizationDetails.phone
      },
      
      // To
      to: {
        name: registration.customerName,
        email: registration.customerEmail,
        address: registration.billingAddress
      },
      
      // Line items
      items: registration.attendees.flatMap(attendee => 
        attendee.tickets.map(ticket => ({
          description: `${ticket.eventName} - ${ticket.ticketType} (${attendee.name})`,
          quantity: 1,
          unitPrice: ticket.price,
          total: ticket.price
        }))
      ),
      
      // Totals
      subtotal: registration.subtotal,
      gst: includeGST ? registration.subtotal * 0.1 : 0,
      total: registration.totalAmount,
      
      // Payment details
      paymentMethod: registration.paymentMethod,
      paymentDate: registration.paymentDate,
      confirmationNumber: registration.confirmationNumber,
      
      // Custom
      customMessage,
      terms: organizationDetails.invoiceTerms
    }
    
    const pdf = await generateInvoicePDF(invoiceData)
    
    // Option to save, email, or download
    return pdf
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Invoice Type</Label>
          <RadioGroup value={invoiceType} onValueChange={setInvoiceType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tax_invoice" id="tax" />
              <Label htmlFor="tax">Tax Invoice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="receipt" id="receipt" />
              <Label htmlFor="receipt">Receipt</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-gst" 
            checked={includeGST}
            onCheckedChange={setIncludeGST}
          />
          <Label htmlFor="include-gst">Include GST (10%)</Label>
        </div>
        
        <div>
          <Label>Custom Message (Optional)</Label>
          <Textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to the invoice..."
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="text-sm space-y-1">
            <p>Invoice #: {generateInvoiceNumber(registration)}</p>
            <p>Customer: {registration.customerName}</p>
            <p>Amount: ${registration.totalAmount.toFixed(2)}</p>
            {includeGST && <p>GST: ${(registration.subtotal * 0.1).toFixed(2)}</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateAndDownload}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={generateAndEmail}>
            Email to Customer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 6. Customer Support Dashboard

### 6.1 RegistrationDetailsView Component

```typescript
// components/organizer/support/RegistrationDetailsView.tsx

interface RegistrationDetailsViewProps {
  registrationId: string
}

export function RegistrationDetailsView({ registrationId }: RegistrationDetailsViewProps) {
  const { data: registration, isLoading } = useRegistrationDetails(registrationId)
  const [activeTab, setActiveTab] = useState('overview')
  
  if (isLoading) return <LoadingSpinner />
  if (!registration) return <NotFound />
  
  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Registration #{registration.confirmationNumber}
          </h2>
          <p className="text-muted-foreground">
            Registered {format(registration.createdAt, 'PPP')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email Customer
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openReissueModal()}>
                Re-issue Tickets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openRefundModal()}>
                Process Refund
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModifyModal()}>
                Modify Registration
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Cancel Registration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Status badges */}
      <div className="flex gap-2">
        <Badge variant={registration.paymentStatus === 'paid' ? 'success' : 'warning'}>
          {registration.paymentStatus}
        </Badge>
        <Badge>{registration.attendees.length} Attendees</Badge>
        <Badge variant="outline">
          ${registration.totalAmount.toFixed(2)}
        </Badge>
      </div>
      
      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <RegistrationOverview registration={registration} />
        </TabsContent>
        
        <TabsContent value="attendees">
          <AttendeeManagement 
            attendees={registration.attendees}
            onEdit={handleEditAttendee}
            onReissue={handleReissueTicket}
          />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentHistory 
            payments={registration.payments}
            refunds={registration.refunds}
            stripeAccountId={registration.stripeAccountId}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <AuditTrail 
            events={registration.auditEvents}
          />
        </TabsContent>
        
        <TabsContent value="notes">
          <InternalNotes 
            notes={registration.internalNotes}
            onAddNote={handleAddNote}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Implementation Notes

1. **Security**: All customer service actions must be logged with user ID and timestamp
2. **Permissions**: Implement role-based access for refunds and data modifications
3. **Webhooks**: Set up Stripe webhooks for refund status updates
4. **Email Templates**: Create professional templates for all customer communications
5. **Testing**: Comprehensive testing for financial operations
6. **Audit Trail**: Every action must be recorded for compliance