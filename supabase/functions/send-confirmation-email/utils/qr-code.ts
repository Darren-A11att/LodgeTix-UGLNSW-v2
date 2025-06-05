export async function getQRCodeDataUrl(qrCodeUrl: string): Promise<string> {
  try {
    // If it's already a data URL, return it
    if (qrCodeUrl.startsWith('data:')) {
      return qrCodeUrl
    }

    // Fetch the QR code image
    const response = await fetch(qrCodeUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch QR code: ${response.statusText}`)
    }

    // Convert to blob and then to base64
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    // Return as data URL
    return `data:${blob.type};base64,${base64}`
  } catch (error) {
    console.error('Error converting QR code to data URL:', error)
    // Return a placeholder or empty string if QR code fetch fails
    return ''
  }
}

export function createQRCodeImage(dataUrl: string, alt: string): string {
  if (!dataUrl) {
    return ''
  }
  
  return `<img src="${dataUrl}" alt="${alt}" style="width: 150px; height: 150px; margin: 16px auto; display: block;" />`
}