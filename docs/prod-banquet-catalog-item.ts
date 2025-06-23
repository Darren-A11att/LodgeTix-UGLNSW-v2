import { Client, Environment } from "square";

async function main() {
    const client = new Client({
        accessToken: "EAAAl7isRcRWatepwSuzEULplnnOizmUT-W_w7DohjyU1x1PFW-zP9QehROk6yxw",
        environment: Environment.Sandbox,
    });
    
    try {
        const response = await client.catalogApi.upsertCatalogObject({
            idempotencyKey: "2a48cfde-4bbe-47ef-8563-8e5eb66f611b",
            object: {
                type: "ITEM",
                id: "TVZG7O2KCZOYOXLAON55HTME",
                updatedAt: "2025-06-23T11:06:16.163Z",
                createdAt: "2025-06-23T00:33:11.461Z",
                version: BigInt(1750676776163),
                isDeleted: false,
                presentAtAllLocations: true,
                itemData: {
                    name: "Grand Proclamation Banquet",
                    isTaxable: true,
                    taxIds: [
                        "AUSSALESTAXMLW3GS6CJYJ05"
                    ],
                    variations: [
                        {
                            type: "ITEM_VARIATION",
                            id: "3UQZF5TP2BLK4N6HIDBYT3LX",
                            updatedAt: "2025-06-23T00:33:56.997Z",
                            createdAt: "2025-06-23T00:33:11.461Z",
                            version: BigInt(1750638836997),
                            isDeleted: false,
                            presentAtAllLocations: true,
                            itemVariationData: {
                                itemId: "TVZG7O2KCZOYOXLAON55HTME",
                                name: "Regular",
                                sku: "proclamationbanquet-200925",
                                ordinal: 1,
                                pricingType: "FIXED_PRICING",
                                priceMoney: {
                                    amount: BigInt(11500),
                                    currency: "AUD"
                                },
                                locationOverrides: [
                                    {
                                        locationId: "LQ4JE0GNCZ3NK",
                                        trackInventory: true,
                                        inventoryAlertType: "LOW_QUANTITY",
                                        inventoryAlertThreshold: BigInt(50)
                                    }
                                ],
                                trackInventory: true,
                                measurementUnitId: "DHDUN5B42PAWOKFZML6ZWN7F",
                                sellable: true,
                                stockable: true
                            }
                        }
                    ],
                    productType: "EVENT",
                    skipModifierScreen: false,
                    event: {
                        uid: "N5JYBZCQNKURZROFJVLB3N4D",
                        startAt: "2025-09-20T08:30:00Z",
                        endAt: "2025-09-20T13:00:00Z",
                        eventLocationTimeZone: "Australia/Sydney",
                        eventLocationName: "Sydney Masonic Centre",
                        eventLocationTypes: [
                            "IN_PERSON"
                        ],
                        addressId: "AKG3LMVBPWLI4HSS5CTA3HXS"
                    },
                    isArchived: false,
                    isAlcoholic: false
                }
            },
            relatedObjects: [
                {
                    type: "TAX",
                    id: "AUSSALESTAXMLW3GS6CJYJ05",
                    updatedAt: "2025-06-18T14:46:34.826Z",
                    createdAt: "2025-06-18T14:46:34.853Z",
                    version: BigInt(1750257994826),
                    isDeleted: false,
                    presentAtAllLocations: true,
                    taxData: {
                        name: "GST",
                        calculationPhase: "TAX_SUBTOTAL_PHASE",
                        inclusionType: "INCLUSIVE",
                        percentage: "10.0",
                        appliesToCustomAmounts: true,
                        enabled: true,
                        taxTypeId: "au_sales_tax",
                        taxTypeName: "Sales Tax",
                        appliesToProductSetId: "7LOXKILJ7SIUFW4ELOKEDTOK",
                        isSecondaryTax: false
                    }
                },
                {
                    type: "MEASUREMENT_UNIT",
                    id: "DHDUN5B42PAWOKFZML6ZWN7F",
                    updatedAt: "2025-06-23T00:31:34.087Z",
                    createdAt: "2025-06-23T00:31:34.124Z",
                    version: BigInt(1750638694087),
                    isDeleted: false,
                    presentAtAllLocations: true,
                    measurementUnitData: {
                        measurementUnit: {
                            customUnit: {
                                name: "Ticket",
                                abbreviation: "Tkt"
                            },
                            type: "TYPE_CUSTOM"
                        },
                        precision: 0
                    }
                },
                {
                    type: "ADDRESS",
                    id: "AKG3LMVBPWLI4HSS5CTA3HXS",
                    updatedAt: "2025-06-23T00:33:13.073Z",
                    createdAt: "2025-06-23T00:33:13.165Z",
                    version: BigInt(1750638793073),
                    isDeleted: false,
                    presentAtAllLocations: true,
                    addressData: {
                        address: {
                            addressLine1: "279 Castlereagh Street",
                            locality: "Sydney",
                            administrativeDistrictLevel1: "NSW",
                            postalCode: "2000",
                            country: "AU"
                        }
                    }
                }
            ]
        });
        
        console.log("Catalog item created/updated successfully!");
        console.log("Item ID:", response.result.catalogObject?.id);
        console.log("Variation ID:", response.result.catalogObject?.itemData?.variations?.[0]?.id);
        
    } catch (error) {
        console.error("Error:", error);
        if (error instanceof Error && 'errors' in error) {
            console.error("Square API errors:", JSON.stringify((error as any).errors, null, 2));
        }
    }
}

main();