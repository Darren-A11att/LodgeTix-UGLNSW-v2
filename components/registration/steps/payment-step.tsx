"use client"

import type React from "react"
import { useState } from "react"
import { useRegistration } from "@/contexts/registration-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Check, CreditCard, Info, Lock, ShieldCheck, Ticket } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SectionHeader } from "../SectionHeader"

export function PaymentStep() {
  const { state, dispatch } = useRegistration()
  const [paymentMethod, setPaymentMethod] = useState<string>("card")
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    saveCard: false,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [processingProgress, setProcessingProgress] = useState(0)

  const handlePrevious = () => {
    dispatch({ type: "PREV_STEP" })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when field is changed
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (paymentMethod === "card") {
      if (!formData.cardName.trim()) {
        errors.cardName = "Name on card is required"
      }

      if (!formData.cardNumber.trim()) {
        errors.cardNumber = "Card number is required"
      } else if (!/^\d{13,19}$/.test(formData.cardNumber.replace(/\s/g, ""))) {
        errors.cardNumber = "Please enter a valid card number"
      }

      if (!formData.expiryDate.trim()) {
        errors.expiryDate = "Expiry date is required"
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        errors.expiryDate = "Please use MM/YY format"
      }

      if (!formData.cvc.trim()) {
        errors.cvc = "CVC is required"
      } else if (!/^\d{3,4}$/.test(formData.cvc)) {
        errors.cvc = "CVC must be 3 or 4 digits"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    // Simulate payment processing with progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setProcessingProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)

        // Complete the payment after progress reaches 100%
        setTimeout(() => {
          dispatch({
            type: "SET_PAYMENT_DETAILS",
            payload: {
              cardName: formData.cardName,
              cardNumber: formData.cardNumber,
              expiryDate: formData.expiryDate,
              cvc: formData.cvc,
            },
          })

          dispatch({ type: "NEXT_STEP" })
          setIsProcessing(false)
        }, 500)
      }
    }, 100)
  }

  const totalAmount = state.tickets.reduce((sum, ticket) => sum + ticket.price, 0)
  const totalTickets = state.tickets.length

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Payment</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please provide your payment details to complete your registration</p>
      </SectionHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="border-masonic-navy">
              <CardHeader className="bg-masonic-navy text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Lock className="mr-2 h-5 w-5" /> Secure Payment
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Your payment information is encrypted and secure
                    </CardDescription>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-masonic-gold" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {isProcessing ? (
                  <div className="space-y-4 py-8">
                    <div className="text-center">
                      <h3 className="text-lg font-medium">Processing Payment</h3>
                      <p className="text-sm text-gray-500">Please do not close this window</p>
                    </div>
                    <Progress value={processingProgress} className="h-2 w-full" />
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        <CreditCard className="h-3 w-3" />
                        <span>Securely processing your payment</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      defaultValue="card"
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          Credit/Debit Card
                        </Label>
                        <div className="flex space-x-1">
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          PayPal
                        </Label>
                        <div className="h-6 w-16 rounded bg-gray-200"></div>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Your card will be charged ${totalAmount.toFixed(2)} for this registration.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="cardName" className={formErrors.cardName ? "text-red-500" : ""}>
                            Name on Card
                          </Label>
                          <Input
                            id="cardName"
                            value={formData.cardName}
                            onChange={(e) => handleChange("cardName", e.target.value)}
                            placeholder="John Doe"
                            className={formErrors.cardName ? "border-red-500" : ""}
                          />
                          {formErrors.cardName && <p className="text-xs text-red-500">{formErrors.cardName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardNumber" className={formErrors.cardNumber ? "text-red-500" : ""}>
                            Card Number
                          </Label>
                          <div className="relative">
                            <CreditCard
                              className={`absolute left-3 top-3 h-4 w-4 ${formErrors.cardNumber ? "text-red-500" : "text-gray-500"}`}
                            />
                            <Input
                              id="cardNumber"
                              value={formData.cardNumber}
                              onChange={(e) => handleChange("cardNumber", formatCardNumber(e.target.value))}
                              placeholder="1234 5678 9012 3456"
                              className={`pl-10 ${formErrors.cardNumber ? "border-red-500" : ""}`}
                              maxLength={19}
                            />
                          </div>
                          {formErrors.cardNumber && <p className="text-xs text-red-500">{formErrors.cardNumber}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryDate" className={formErrors.expiryDate ? "text-red-500" : ""}>
                              Expiry Date
                            </Label>
                            <Input
                              id="expiryDate"
                              value={formData.expiryDate}
                              onChange={(e) => handleChange("expiryDate", e.target.value)}
                              placeholder="MM/YY"
                              className={formErrors.expiryDate ? "border-red-500" : ""}
                              maxLength={5}
                            />
                            {formErrors.expiryDate && <p className="text-xs text-red-500">{formErrors.expiryDate}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvc" className={formErrors.cvc ? "text-red-500" : ""}>
                              CVC
                            </Label>
                            <Input
                              id="cvc"
                              value={formData.cvc}
                              onChange={(e) => handleChange("cvc", e.target.value)}
                              placeholder="123"
                              className={formErrors.cvc ? "border-red-500" : ""}
                              maxLength={4}
                            />
                            {formErrors.cvc && <p className="text-xs text-red-500">{formErrors.cvc}</p>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveCard"
                            checked={formData.saveCard}
                            onCheckedChange={(checked) => handleChange("saveCard", checked)}
                          />
                          <Label htmlFor="saveCard" className="text-sm cursor-pointer">
                            Save this card for future registrations
                          </Label>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "paypal" && (
                      <div className="space-y-4">
                        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            You will be redirected to PayPal to complete your payment of ${totalAmount.toFixed(2)}.
                          </AlertDescription>
                        </Alert>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                          <p className="text-sm text-gray-600">
                            Click "Continue to PayPal" below to proceed with your payment
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between bg-gray-50 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isProcessing}
                  className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : paymentMethod === "paypal" ? (
                    <>Continue to PayPal</>
                  ) : (
                    <>Pay ${totalAmount.toFixed(2)}</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader className="bg-masonic-lightblue/20 pb-3">
              <CardTitle className="flex items-center text-lg">
                <Ticket className="mr-2 h-5 w-5" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Tickets:</span>
                  <span className="font-medium">{totalTickets}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total Attendees:</span>
                  <span className="font-medium">
                    {state.additionalAttendees.length + (state.primaryAttendee ? 1 : 0)}
                  </span>
                </div>
              </div>

              <div className="max-h-[200px] overflow-y-auto">
                {state.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between border-b py-2 text-sm">
                    <div className="flex items-start">
                      <Check className="mr-1 mt-0.5 h-3 w-3 text-green-500" />
                      <span>{ticket.name}</span>
                    </div>
                    <span>${ticket.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="text-lg">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="rounded-lg bg-masonic-lightgold/20 p-3 text-xs text-masonic-navy">
                <div className="flex">
                  <ShieldCheck className="mr-2 h-4 w-4 flex-shrink-0" />
                  <p>
                    Your payment is secured with industry-standard encryption. We do not store your full card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
