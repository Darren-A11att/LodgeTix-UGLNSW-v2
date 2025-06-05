import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    url?: string
    content?: string
  }>
  tags?: Array<{
    name: string
    value: string
  }>
}

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendEmail(options: EmailOptions): Promise<string> {
  const resend = getResendClient()
  const fromEmail = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@lodgetix.com'
  const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'LodgeTix'
  
  try {
    // Prepare attachments if any
    const attachments = await prepareAttachments(options.attachments)
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments,
      tags: options.tags
    })
    
    if (error) {
      throw error
    }
    
    return data?.id || ''
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

async function prepareAttachments(attachments?: EmailOptions['attachments']): Promise<any[]> {
  if (!attachments || attachments.length === 0) {
    return []
  }
  
  const prepared = []
  
  for (const attachment of attachments) {
    if (attachment.content) {
      // Content is already provided
      prepared.push({
        filename: attachment.filename,
        content: attachment.content
      })
    } else if (attachment.url) {
      // Fetch content from URL
      try {
        const response = await fetch(attachment.url)
        if (!response.ok) {
          console.error(`Failed to fetch attachment: ${attachment.url}`)
          continue
        }
        
        const buffer = await response.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        
        prepared.push({
          filename: attachment.filename,
          content: base64
        })
      } catch (error) {
        console.error(`Error fetching attachment ${attachment.url}:`, error)
      }
    }
  }
  
  return prepared
}

// Retry logic with exponential backoff
export async function sendEmailWithRetry(
  options: EmailOptions, 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendEmail(options)
    } catch (error) {
      lastError = error
      
      // Don't retry on validation errors
      if (error.message.includes('validation') || 
          error.message.includes('invalid')) {
        throw error
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Failed to send email after retries')
}

// Batch sending for multiple recipients
export async function sendEmailBatch(
  recipients: string[],
  subject: string,
  html: string,
  options?: Partial<EmailOptions>
): Promise<{ successful: string[], failed: string[] }> {
  const successful: string[] = []
  const failed: string[] = []
  
  // Process in batches to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendEmailWithRetry({
            to: recipient,
            subject,
            html,
            ...options
          })
          successful.push(recipient)
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error)
          failed.push(recipient)
        }
      })
    )
    
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return { successful, failed }
}