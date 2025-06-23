import { Client, Environment } from "square";
import * as fs from 'fs';

async function main() {
    // Read the exact production response
    const banquetResponse = JSON.parse(fs.readFileSync('./docs/banquet-response.json', 'utf8'));
    
    const client = new Client({
        accessToken: "EAAAl7isRcRWatepwSuzEULplnnOizmUT-W_w7DohjyU1x1PFW-zP9QehROk6yxw", // Sandbox token
        environment: Environment.Sandbox,
    });
    
    try {
        console.log("Upserting catalog object to sandbox...");
        
        // Transform the JSON to match SDK expectations
        // Remove production-specific IDs that don't exist in sandbox
        const catalogObject = {
            type: "ITEM" as const,
            id: "#banquet-item-sandbox", // Let Square generate a new ID for sandbox
            presentAtAllLocations: banquetResponse.object.present_at_all_locations,
            itemData: {
                name: banquetResponse.object.item_data.name,
                isTaxable: banquetResponse.object.item_data.is_taxable,
                // Remove taxIds as they're production-specific
                variations: banquetResponse.object.item_data.variations.map((v: any) => ({
                    type: "ITEM_VARIATION" as const,
                    id: "#banquet-variation-sandbox", // Let Square generate new ID
                    presentAtAllLocations: v.present_at_all_locations,
                    itemVariationData: {
                        itemId: "#banquet-item-sandbox",
                        name: v.item_variation_data.name,
                        sku: v.item_variation_data.sku,
                        ordinal: v.item_variation_data.ordinal,
                        pricingType: v.item_variation_data.pricing_type,
                        priceMoney: {
                            amount: BigInt(v.item_variation_data.price_money.amount),
                            currency: v.item_variation_data.price_money.currency
                        },
                        trackInventory: v.item_variation_data.track_inventory,
                        // Remove measurementUnitId as it's production-specific
                        sellable: v.item_variation_data.sellable,
                        stockable: v.item_variation_data.stockable
                    }
                })),
                productType: banquetResponse.object.item_data.product_type,
                skipModifierScreen: banquetResponse.object.item_data.skip_modifier_screen,
                isArchived: banquetResponse.object.item_data.is_archived,
                isAlcoholic: banquetResponse.object.item_data.is_alcoholic
            }
        };
        
        const response = await client.catalogApi.upsertCatalogObject({
            idempotencyKey: `banquet-upsert-${Date.now()}`,
            object: catalogObject
        });
        
        console.log("\n✅ Catalog item upserted successfully!");
        console.log("Item ID:", response.result.catalogObject?.id);
        console.log("Item Name:", response.result.catalogObject?.itemData?.name);
        
        // Find the variation
        const variations = response.result.catalogObject?.itemData?.variations;
        if (variations && variations.length > 0) {
            const variation = variations[0];
            console.log("\n📦 Variation Details:");
            console.log("Variation ID:", variation.id);
            console.log("Variation Name:", variation.itemVariationData?.name);
            console.log("Price:", variation.itemVariationData?.priceMoney?.amount, "cents");
            console.log("Track Inventory:", variation.itemVariationData?.trackInventory);
            
            console.log("\n🔥 IMPORTANT: Update your database with this variation ID:");
            console.log(`UPDATE packages SET catalog_object_id = '${variation.id}' WHERE package_name = 'Lodge Package';`);
        }
        
        // Now demonstrate how to create an order with this item
        console.log("\n📋 To create an order with this item (quantity 10), use:");
        console.log("Line Item:");
        console.log({
            catalogObjectId: variations?.[0]?.id, // Use the VARIATION ID
            quantity: "10",
            basePriceMoney: {
                amount: 11500, // Price per item in cents
                currency: "AUD"
            }
        });
        
    } catch (error) {
        console.error("Error upserting catalog item:", error);
        if (error instanceof Error && 'errors' in error) {
            console.error("Square API errors:", JSON.stringify((error as any).errors, null, 2));
        }
    }
}

main().catch(console.error);