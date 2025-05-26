// Test script for the event tickets service
import { getServerEventTicketsService } from '../lib/services/event-tickets-service'

const GRAND_PROCLAMATION_PARENT_ID = "307c2d85-72d5-48cf-ac94-082ca2a5d23d"

async function testEventTicketsService() {
  console.log('Testing Event Tickets Service...\n')
  
  try {
    const service = getServerEventTicketsService()
    
    // Test 1: Fetch child events with tickets and packages
    console.log('Test 1: Fetching child events for Grand Proclamation 2025...')
    const childEventsData = await service.getChildEventsWithTicketsAndPackages(GRAND_PROCLAMATION_PARENT_ID)
    
    console.log(`Found ${childEventsData.length} child events:`)
    childEventsData.forEach((eventData, index) => {
      console.log(`\n${index + 1}. ${eventData.event.title} (${eventData.event.id})`)
      console.log(`   - Tickets: ${eventData.tickets.length}`)
      eventData.tickets.forEach(ticket => {
        console.log(`     • ${ticket.name}: $${ticket.price} - ${ticket.eligibleAttendeeTypes.join(', ')}`)
      })
      console.log(`   - Packages: ${eventData.packages.length}`)
      eventData.packages.forEach(pkg => {
        console.log(`     • ${pkg.name}: $${pkg.price} - ${pkg.eligibleAttendeeTypes.join(', ')}`)
        console.log(`       Includes: ${pkg.includes.length} tickets`)
      })
    })
    
    // Test 2: Fetch tickets for a specific event
    if (childEventsData.length > 0) {
      const firstChildEvent = childEventsData[0].event
      console.log(`\n\nTest 2: Fetching tickets for specific event: ${firstChildEvent.title}`)
      const { tickets, packages } = await service.getEventTicketsAndPackages(firstChildEvent.id)
      
      console.log(`Direct fetch results:`)
      console.log(`- Tickets: ${tickets.length}`)
      console.log(`- Packages: ${packages.length}`)
    }
    
    console.log('\n✅ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testEventTicketsService()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })