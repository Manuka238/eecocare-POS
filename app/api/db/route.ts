import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, POSDatabase } from "@/lib/db";
import { checkDuplicateContact } from "@/lib/contact-data";

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({ success: true, db });
  } catch (error: any) {
    console.error("Failed in GET /api/db:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load database" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, collection, payload } = body;

    if (!action || !collection) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: action, collection" },
        { status: 400 }
      );
    }

    const db = await readDb();

    switch (collection) {
      case "contacts":
        if (action === "add") {
          // Perform double-track duplicate check
          const dupCheck = checkDuplicateContact(db.contacts, payload.mobile || "", payload.address1 || "");
          if (dupCheck.isDuplicate) {
            return NextResponse.json(
              { success: false, error: dupCheck.reason },
              { status: 400 }
            );
          }
          db.contacts = [payload, ...db.contacts];
        } else if (action === "update") {
          const { id, updates } = payload;
          db.contacts = db.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          );
        } else if (action === "delete") {
          const { id } = payload;
          db.contacts = db.contacts.filter((c) => c.id !== id);
        } else if (action === "delete_multiple") {
          const { ids } = payload;
          db.contacts = db.contacts.filter((c) => !ids.includes(c.id));
        } else if (action === "add_bulk") {
          const { contacts: bulkContacts } = payload;
          if (Array.isArray(bulkContacts)) {
            // Append and avoid internal or duplicate ID clash with existing
            const existingIds = new Set(db.contacts.map((c) => c.id));
            const filteredBulk = bulkContacts.filter((c) => !existingIds.has(c.id));
            db.contacts = [...filteredBulk, ...db.contacts];
          }
        } else {
          return NextResponse.json(
            { success: false, error: `Unsupported action '${action}' for collection '${collection}'` },
            { status: 400 }
          );
        }
        break;

      case "products":
        if (action === "add") {
          db.products = [payload, ...db.products];
        } else if (action === "update") {
          const { sku, updates } = payload;
          db.products = db.products.map((p) =>
            p.sku === sku ? { ...p, ...updates } : p
          );
        } else if (action === "delete") {
          const { sku } = payload;
          db.products = db.products.filter((p) => p.sku !== sku);
        } else if (action === "import_bulk") {
          const { products: bulkProducts } = payload;
          if (Array.isArray(bulkProducts)) {
            // 1. Auto-create missing categories
            const existingCatNames = new Set(db.categories.map((c) => c.name.toLowerCase()));
            bulkProducts.forEach((newP) => {
              const catName = String(newP.category || "").trim();
              if (catName && !existingCatNames.has(catName.toLowerCase())) {
                const newCatCode = "CAT-" + catName.substring(0, 3).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
                db.categories.unshift({
                  id: Math.random().toString(36).substring(7),
                  name: catName,
                  code: newCatCode,
                  description: "Automatically created during bulk product import.",
                  productsCount: 1,
                  valuation: 0,
                  lowStockCount: 0
                });
                existingCatNames.add(catName.toLowerCase());
              }
            });

            // 2. Perform create-or-update merge on products by SKU
            const existingProductsMap = new Map(db.products.map((p) => [p.sku.toLowerCase(), p]));
            
            bulkProducts.forEach((newP) => {
              const skuLower = newP.sku.toLowerCase();
              if (existingProductsMap.has(skuLower)) {
                // Update existing product
                const existing = existingProductsMap.get(skuLower)!;
                Object.assign(existing, newP);
              } else {
                // Add new product
                db.products.unshift(newP);
              }
            });
          }
        } else {
          return NextResponse.json(
            { success: false, error: `Unsupported action '${action}' for collection '${collection}'` },
            { status: 400 }
          );
        }
        break;

      case "categories":
        if (action === "add") {
          db.categories = [payload, ...db.categories];
        } else if (action === "update") {
          const { id, updates } = payload;
          db.categories = db.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          );
        } else if (action === "delete") {
          const { id } = payload;
          db.categories = db.categories.filter((c) => c.id !== id);
        } else if (action === "delete_multiple") {
          const { ids } = payload;
          db.categories = db.categories.filter((c) => !ids.includes(c.id));
        } else {
          return NextResponse.json(
            { success: false, error: `Unsupported action '${action}' for collection '${collection}'` },
            { status: 400 }
          );
        }
        break;

      case "brands":
        if (action === "add") {
          db.brands = [payload, ...db.brands];
        } else if (action === "update") {
          const { id, updates } = payload;
          db.brands = db.brands.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          );
        } else if (action === "delete") {
          const { id } = payload;
          db.brands = db.brands.filter((b) => b.id !== id);
        } else if (action === "delete_multiple") {
          const { ids } = payload;
          db.brands = db.brands.filter((b) => !ids.includes(b.id));
        } else {
          return NextResponse.json(
            { success: false, error: `Unsupported action '${action}' for collection '${collection}'` },
            { status: 400 }
          );
        }
        break;

      case "units":
        if (action === "add") {
          db.units = [payload, ...db.units];
        } else if (action === "update") {
          const { id, updates } = payload;
          db.units = db.units.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          );
        } else if (action === "delete") {
          const { id } = payload;
          db.units = db.units.filter((u) => u.id !== id);
        } else if (action === "delete_multiple") {
          const { ids } = payload;
          db.units = db.units.filter((u) => !ids.includes(u.id));
        } else {
          return NextResponse.json(
            { success: false, error: `Unsupported action '${action}' for collection '${collection}'` },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported collection '${collection}'` },
          { status: 400 }
        );
    }

    const saveSuccess = await writeDb(db);
    if (!saveSuccess) {
      return NextResponse.json(
        { success: false, error: "Failed to write updates to database storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, db });
  } catch (error: any) {
    console.error("Failed in POST /api/db:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mutate database" },
      { status: 500 }
    );
  }
}
