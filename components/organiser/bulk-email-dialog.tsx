'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { sendBulkEmail } from '@/app/(portals)/organiser/actions'
import { useToast } from '@/hooks/use-toast'

interface BulkEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  functionId?: string
  eventId?: string
  recipientCount: number
  selectedRegistrations?: string[]
  statusFilter?: string
}

export function BulkEmailDialog({
  open,
  onOpenChange,
  functionId,
  eventId,
  recipientCount,
  selectedRegistrations,
  statusFilter,
}: BulkEmailDialogProps) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sendCopy, setSendCopy] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both subject and message content.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const filters: any = {}
      if (functionId) filters.functionId = functionId
      if (eventId) filters.eventId = eventId
      if (statusFilter && statusFilter !== 'all') {
        filters.registrationStatus = [statusFilter]
      }

      const emailResult = await sendBulkEmail(filters, {
        subject,
        content,
        sendCopy,
      })

      setResult(emailResult)

      if (emailResult.failed === 0) {
        toast({
          title: 'Emails Sent Successfully',
          description: `${emailResult.sent} email${emailResult.sent !== 1 ? 's' : ''} sent successfully.`,
        })
      } else {
        toast({
          title: 'Emails Sent with Errors',
          description: `${emailResult.sent} sent, ${emailResult.failed} failed.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending bulk email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      // Reset form after a delay
      setTimeout(() => {
        setSubject('')
        setContent('')
        setSendCopy(true)
        setResult(null)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to Registrants
          </DialogTitle>
          <DialogDescription>
            Compose and send an email to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <Alert className={result.failed === 0 ? 'border-green-600' : 'border-orange-600'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Email Send Complete</div>
                <div className="space-y-1">
                  <p>Successfully sent: {result.sent} email{result.sent !== 1 ? 's' : ''}</p>
                  {result.failed > 0 && (
                    <p className="text-destructive">Failed to send: {result.failed} email{result.failed !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Important Update Regarding Your Registration"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                placeholder="Write your message here..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                required
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                This message will be sent as plain text. Line breaks will be preserved.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="send-copy" className="text-base cursor-pointer">
                  Send me a copy
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a copy of this email for your records
                </p>
              </div>
              <Switch
                id="send-copy"
                checked={sendCopy}
                onCheckedChange={setSendCopy}
                disabled={loading}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This action will send emails to all {recipientCount} selected recipients. 
                Please review your message carefully before sending.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email{recipientCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}