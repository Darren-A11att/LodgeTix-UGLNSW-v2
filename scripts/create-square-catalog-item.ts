import { Client, Environment } from 'square';

async function createCatalogItem() {
  const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN || 'EAAAl7isRcRWatepwSuzEULplnnOizmUT-W_w7DohjyU1x1PFW-zP9QehROk6yxw',
    environment: Environment.Sandbox,
  });

  try {
    // Create catalog item for Lodge Package
    const response = await client.catalogApi.upsertCatalogObject({
      idempotencyKey: `lodge-package-${Date.now()}`,
      object: {
        type: 'ITEM',
        id: '#lodge-package', // Let Square generate the ID
        itemData: {
          name: 'Lodge Package',
          description: 'Package for Lodges - 10 tickets for Banquet',
          variations: [
            {
              type: 'ITEM_VARIATION',
              id: '#lodge-package-variation',
              itemVariationData: {
                itemId: '#lodge-package',
                name: 'Standard',
                pricingType: 'FIXED_PRICING',
                priceMoney: {
                  amount: BigInt(115000), // $1150.00 in cents
                  currency: 'AUD'
                },
                trackInventory: false // Disable inventory tracking for now
              }
            }
          ]
        }
      }
    });

    console.log('Catalog item created successfully:');
    console.log('Item ID:', response.result.catalogObject?.id);
    console.log('Item Name:', response.result.catalogObject?.itemData?.name);
    if (response.result.catalogObject?.itemData?.variations?.[0]) {
      console.log('Variation ID:', response.result.catalogObject.itemData.variations[0].id);
    }
    
    // Also create other common packages if needed
    const packages = [
      {
        tempId: '#individual-ticket',
        name: 'Individual Ticket',
        description: 'Single ticket for individual attendee',
        price: 12000 // $120.00
      },
      {
        tempId: '#delegation-package',
        name: 'Delegation Package',
        description: 'Package for delegations - 5 tickets',
        price: 57500 // $575.00
      }
    ];

    for (const pkg of packages) {
      const pkgResponse = await client.catalogApi.upsertCatalogObject({
        idempotencyKey: `${pkg.tempId}-${Date.now()}`,
        object: {
          type: 'ITEM',
          id: pkg.tempId,
          itemData: {
            name: pkg.name,
            description: pkg.description,
            variations: [
              {
                type: 'ITEM_VARIATION',
                id: `${pkg.tempId}-variation`,
                itemVariationData: {
                  itemId: pkg.tempId,
                  name: 'Standard',
                  pricingType: 'FIXED_PRICING',
                  priceMoney: {
                    amount: BigInt(pkg.price),
                    currency: 'AUD'
                  },
                  trackInventory: false
                }
              }
            ]
          }
        }
      });
      
      console.log(`\nCreated ${pkg.name}:`);
      console.log('Item ID:', pkgResponse.result.catalogObject?.id);
      console.log('Variation ID:', pkgResponse.result.catalogObject?.itemData?.variations?.[0]?.id);
    }

  } catch (error) {
    console.error('Error creating catalog item:', error);
    if (error instanceof Error && 'errors' in error) {
      console.error('Square API errors:', JSON.stringify((error as any).errors, null, 2));
    }
  }
}

// Run the script
createCatalogItem().catch(console.error);