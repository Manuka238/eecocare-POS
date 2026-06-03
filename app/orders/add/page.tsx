"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders as initialOrders, ORDER_STATUSES, COURIERS, DISTRICTS, systemUsers } from "@/lib/crh-data";
import { useDataContext } from "@/components/data-provider";
import { cleanPhone, normalizeAddress } from "@/lib/contact-data";
import { products } from "@/lib/mock-data";
import { Sparkles, ClipboardPaste, Save, RotateCcw, Plus, Minus, Trash2, ShoppingBag, Boxes, Search, X, ArrowLeft, Gift } from "lucide-react";

const ENRICHED_PRODUCTS = [
  // Groceries
  { name: "Rice 5kg", sku: "RC-5KG", stock: 62, price: 18.0, brand: "EECO", unit: "Pack", category: "Groceries", subcategory: "Grains & Rice" },
  { name: "Basmati Rice 1kg", sku: "RC-BS1", stock: 40, price: 8.5, brand: "Ceylon Gold", unit: "Pack", category: "Groceries", subcategory: "Grains & Rice" },
  { name: "Sugar 1kg", sku: "SG-1KG", stock: 94, price: 2.8, brand: "Sweety", unit: "Pack", category: "Groceries", subcategory: "Sweeteners" },
  { name: "Brown Sugar 1kg", sku: "SG-BR1", stock: 50, price: 3.5, brand: "Sweety", unit: "Pack", category: "Groceries", subcategory: "Sweeteners" },
  
  // Beverages
  { name: "Tea Pack 220g", sku: "TE-220", stock: 18, price: 6.4, brand: "Ceylon Gold", unit: "Box", category: "Beverages", subcategory: "Tea & Coffee" },
  { name: "Green Tea Box", sku: "TE-GRN", stock: 30, price: 4.8, brand: "Ceylon Gold", unit: "Box", category: "Beverages", subcategory: "Tea & Coffee" },
  { name: "Instant Coffee 100g", sku: "CF-INS", stock: 25, price: 12.0, brand: "EECO", unit: "Jar", category: "Beverages", subcategory: "Tea & Coffee" },
  { name: "Ginger Beer 500ml", sku: "DR-GB5", stock: 80, price: 2.2, brand: "Elephant", unit: "Bottle", category: "Beverages", subcategory: "Soft Drinks" },
  { name: "Fruit Nectar 1L", sku: "DR-FN1", stock: 45, price: 4.5, brand: "Kist", unit: "Pack", category: "Beverages", subcategory: "Soft Drinks" },
  
  // Dairy
  { name: "Milk Powder 400g", sku: "MP-400", stock: 11, price: 7.6, brand: "Dairy Best", unit: "Tin", category: "Dairy", subcategory: "Milk Powders" },
  { name: "Salted Butter 200g", sku: "DY-BTR", stock: 20, price: 9.2, brand: "Dairy Best", unit: "Pack", category: "Dairy", subcategory: "Butter & Cheese" },
  { name: "Cheddar Cheese 200g", sku: "DY-CHS", stock: 15, price: 14.5, brand: "Dairy Best", unit: "Pack", category: "Dairy", subcategory: "Butter & Cheese" },
  
  // Snacks
  { name: "Biscuits Box", sku: "BS-BOX", stock: 48, price: 3.2, brand: "Crunch", unit: "Box", category: "Snacks", subcategory: "Biscuits & Cookies" },
  { name: "Chocolate Cookies", sku: "BS-CKY", stock: 60, price: 4.0, brand: "Crunch", unit: "Pack", category: "Snacks", subcategory: "Biscuits & Cookies" },
  { name: "Cassava Chips 100g", sku: "SN-CHP", stock: 70, price: 1.8, brand: "EECO", unit: "Pack", category: "Snacks", subcategory: "Savory Snacks" }
];

const SPECIAL_PACKAGES = [
  {
    name: "Family Essential Pack 🌾",
    code: "PKG-FAM",
    description: "A complete bundle of daily essential groceries for a family.",
    originalPrice: 3120,
    packagePrice: 3000,
    items: [
      { sku: "RC-5KG", name: "Rice 5kg", qty: 1, price: 1750 },
      { sku: "SG-1KG", name: "Sugar 1kg", qty: 2, price: 260 },
      { sku: "MP-400", name: "Milk Powder 400g", qty: 1, price: 730 }
    ]
  },
  {
    name: "Tea Time Combo ☕",
    code: "PKG-TEA",
    description: "Perfect tea time combo with Ceylon Gold tea and crunchy biscuits.",
    originalPrice: 1600,
    packagePrice: 1500,
    items: [
      { sku: "TE-220", name: "Tea Pack 220g", qty: 2, price: 600 },
      { sku: "BS-BOX", name: "Biscuits Box", qty: 1, price: 300 }
    ]
  },
  {
    name: "Snack Time Bundle 🍪",
    code: "PKG-SNK",
    description: "Satisfy your sweet and savory cravings with this delicious treat pack.",
    originalPrice: 980,
    packagePrice: 880,
    items: [
      { sku: "BS-CKY", name: "Chocolate Cookies", qty: 2, price: 360 },
      { sku: "SN-CHP", name: "Cassava Chips 100g", qty: 1, price: 160 }
    ]
  }
];

const getNowDateTimeString = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const INITIAL = {
  orderNumber: "",
  customerName: "",
  address: "",
  district: "",
  city: "",
  contact: "",
  price: "",
  paymentMethod: "COD",
  courier: "",
  courierBranch: "",
  salesChannel: "WhatsApp",
  salesPerson: "",
  waybillNumber: "",
  notes: "",
  status: "Ordered",
  orderedAt: getNowDateTimeString(),
  isScheduled: false,
  scheduledAt: "",
  urgentLevel: "none",
};

function cleanPrice(val: string) {
  if (!val) return "";
  // Strip out "Rs", commas, spaces, and other non-numeric characters, leaving only digits and a decimal point
  const cleaned = val.replace(/[^0-9.]/g, "");
  // Handle multiple decimal points if present
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return cleaned;
}

function parseSalesField(val: string) {
  if (!val) {
    return { channel: "WhatsApp", person: "" };
  }
  
  const cleaned = val.trim().toLowerCase();
  
  let channel = "WhatsApp"; // default
  let person = "";
  
  // Parse channel prefix (e.g., w-MD -> WhatsApp, m-RW -> Messenger)
  if (cleaned.startsWith("w-") || cleaned === "w" || cleaned.includes("whatsapp")) {
    channel = "WhatsApp";
  } else if (cleaned.startsWith("m-") || cleaned === "m" || cleaned.includes("messenger")) {
    channel = "Messenger";
  } else if (cleaned.startsWith("fb-") || cleaned === "fb" || cleaned.includes("facebook")) {
    channel = "Facebook";
  } else if (cleaned.includes("website") || cleaned.includes("web") || cleaned.includes("site")) {
    channel = "Website";
  }
  
  // Parse person suffix (e.g., MD or RW)
  if (cleaned.includes("md")) {
    person = "MD";
  } else if (cleaned.includes("rw")) {
    person = "RW";
  }
  
  return { channel, person };
}

function normalizePaymentMethod(val: string) {
  if (!val) return "COD";
  const cleaned = val.trim().toLowerCase();
  if (cleaned.includes("cod") || cleaned.includes("cash")) return "COD";
  if (cleaned.includes("card") || cleaned.includes("credit") || cleaned.includes("debit")) return "Card";
  if (cleaned.includes("bank") || cleaned.includes("transfer") || cleaned.includes("online")) return "Bank Transfer";
  return "COD";
}

function normalizeCourier(val: string) {
  if (!val) return "";
  const cleaned = val.trim().toLowerCase();
  if (cleaned.includes("pronto")) return "Pronto";
  if (cleaned.includes("koombiyo") || cleaned.includes("koombio")) return "Koombiyo";
  if (cleaned.includes("dhl")) return "DHL Express";
  if (cleaned.includes("fedex")) return "FedEx Lanka";
  if (cleaned.includes("post") || cleaned.includes("sl post") || cleaned.includes("sri lanka post")) return "Sri Lanka Post";
  return val;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function decodeOrderNumber(orderNo: string): { year: string; monthlyOrder: string; date: string; dailyOrder: string; fullDate: string; monthName: string; dayNum: string; valid: boolean } | null {
  if (!orderNo) return null;
  const parts = orderNo.split("-");
  if (parts.length !== 4) return null;

  const [yearPart, monthlyOrderPart, mdPart, dailyOrderPart] = parts;
  if (!/^\d{2}$/.test(yearPart) || !/^\d{4}$/.test(mdPart)) return null;

  const year = `20${yearPart}`;
  const monthStr = mdPart.substring(0, 2);
  const dayStr = mdPart.substring(2, 4);
  const monthIdx = parseInt(monthStr, 10) - 1;

  const dateObj = new Date(`${year}-${monthStr}-${dayStr}`);
  if (isNaN(dateObj.getTime()) || monthIdx < 0 || monthIdx > 11) return null;

  return {
    year,
    monthlyOrder: String(parseInt(monthlyOrderPart, 10)),
    date: `${year}-${monthStr}-${dayStr}`,
    dailyOrder: String(parseInt(dailyOrderPart, 10)),
    fullDate: `${MONTH_NAMES[monthIdx]} ${parseInt(dayStr, 10)}, ${year}`,
    monthName: MONTH_NAMES[monthIdx],
    dayNum: String(parseInt(dayStr, 10)),
    valid: true,
  };
}

function parseOrderText(text: string) {
  const extract = (key: string) => {
    // Support key matching with or without optional '#' prefix
    const regex = new RegExp(`(?:#)?${key}\\s*:\\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const rawPrice = extract("Total") || extract("Price") || extract("Amount");
  const rawSales = extract("Sales") || extract("Channel");
  const { channel, person } = parseSalesField(rawSales);

  const orderNumber = extract("Order No") || extract("Order");

  let orderedAt = "";
  if (orderNumber) {
    const decoded = decodeOrderNumber(orderNumber);
    if (decoded) {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      orderedAt = `${decoded.date}T${hrs}:${mins}`;
    }
  }

  const result: any = {
    orderNumber,
    customerName: extract("Name"),
    address: extract("Address"),
    district: extract("District"),
    city: extract("City"),
    contact: extract("Contact") || extract("Phone") || extract("Mobile"),
    price: cleanPrice(rawPrice),
    paymentMethod: normalizePaymentMethod(extract("Payment")),
    courier: normalizeCourier(extract("Courier")),
    salesChannel: channel,
    salesPerson: person,
    notes: extract("Notes") || extract("Note"),
  };

  if (orderedAt) {
    result.orderedAt = orderedAt;
  }

  return result;
}

interface SelectedItem {
  sku: string;
  name: string;
  price: number;
  qty: number;
}

export default function AddOrderPage() {
  const { dark } = useThemeMode();
  const { contacts: dbContacts, addContact } = useDataContext();
  const [pasteText, setPasteText] = useState("");
  const [form, setForm] = useState(INITIAL);
  const [parsed, setParsed] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Dynamic user list pulling from localStorage
  const [users, setUsers] = useState<any[]>(systemUsers);

  // Easy Item Selection states
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "packages">("products");
  const [specialPackages, setSpecialPackages] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("system_users");
      if (storedUsers) {
        try {
          setUsers(JSON.parse(storedUsers));
        } catch (e) {
          console.error("Failed to parse system_users in add order page", e);
        }
      }

      const storedPkgs = localStorage.getItem("special_packages");
      if (storedPkgs) {
        try {
          setSpecialPackages(JSON.parse(storedPkgs));
        } catch (e) {
          console.error("Failed to parse special packages in add order page", e);
        }
      } else {
        setSpecialPackages(SPECIAL_PACKAGES);
        localStorage.setItem("special_packages", JSON.stringify(SPECIAL_PACKAGES));
      }
    }
  }, []);

  // Sync selected items sum to form price input
  useEffect(() => {
    if (selectedItems.length > 0) {
      const sum = selectedItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      setForm((f) => ({ ...f, price: String(sum) }));
      setErrors((e) => ({ ...e, price: false }));
    } else {
      setForm((f) => ({ ...f, price: "" }));
    }
  }, [selectedItems]);

  const handleAddItem = (prod: typeof ENRICHED_PRODUCTS[0]) => {
    const scaledPrice = Math.round((prod.price || 0) * 100);
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.sku === prod.sku);
      if (exists) {
        return prev.map((item) =>
          item.sku === prod.sku ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { sku: prod.sku, name: prod.name, price: scaledPrice, qty: 1 }];
    });
  };

  const handleDecreaseQty = (sku: string) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.sku === sku) {
          return { ...item, qty: Math.max(1, item.qty - 1) };
        }
        return item;
      })
    );
  };

  const handleIncreaseQty = (sku: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const handleRemoveItem = (sku: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleAddPackage = (pkg: any) => {
    setSelectedItems((prev) => {
      let updated = [...prev];
      pkg.items.forEach((pkgItem) => {
        const existsIdx = updated.findIndex((item) => item.sku === pkgItem.sku);
        if (existsIdx > -1) {
          updated[existsIdx] = {
            ...updated[existsIdx],
            qty: updated[existsIdx].qty + pkgItem.qty,
            price: pkgItem.price
          };
        } else {
          updated.push({
            sku: pkgItem.sku,
            name: pkgItem.name,
            price: pkgItem.price,
            qty: pkgItem.qty
          });
        }
      });
      return updated;
    });

    setForm((f) => {
      const tag = `[Package: ${pkg.name.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim()}]`;
      const currentNotes = f.notes ? f.notes.trim() : "";
      if (currentNotes.includes(tag)) {
        return f;
      }
      return {
        ...f,
        notes: currentNotes ? `${currentNotes} ${tag}` : tag
      };
    });
  };

  const handleParse = () => {
    const data = parseOrderText(pasteText);
    setForm((f) => ({ ...f, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v)) }));
    setParsed(true);
    setTimeout(() => setParsed(false), 3000);
  };

  const handleSave = () => {
    const required = ["orderNumber", "customerName", "contact", "price"];
    const newErrors: Record<string, boolean> = {};
    required.forEach((k) => { if (!(form as any)[k]) newErrors[k] = true; });
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Get existing orders from localStorage
      let existingOrders: any[] = [];
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("eeco-care-pos-orders");
        if (saved) {
          try {
            existingOrders = JSON.parse(saved);
          } catch (e) {
            console.error("Failed to parse orders:", e);
          }
        } else {
          // Fallback mapping
          existingOrders = initialOrders.map((o) => {
            const isDefaultDispatched = o.status === "delivered" || o.id === "o2" || o.id === "o5" || o.id === "o10";
            return {
              ...o,
              packingStatus: (isDefaultDispatched ? "Dispatched" : "Ordered") as "Ordered" | "Packed" | "Dispatched",
              weightGrams: o.id === "o2" ? 480 : o.id === "o5" ? 220 : o.id === "o10" ? 750 : 320,
              boxSize: o.id === "o2" ? "Medium" : o.id === "o5" ? "Small" : o.id === "o10" ? "Large" : "Medium",
              dispatchedDate: isDefaultDispatched
                ? new Date(new Date().setDate(new Date().getDate() - (o.id === "o1" ? 1 : 2))).toISOString().split("T")[0]
                : undefined,
            };
          });
        }
      }

      // ─── Order & Waybill Uniqueness checks ───
      const duplicateOrderNumber = existingOrders.find(
        (o) => o.orderNumber.trim().toLowerCase() === form.orderNumber.trim().toLowerCase()
      );
      if (duplicateOrderNumber) {
        alert(`Validation Error: An order with Order Number "${form.orderNumber}" already exists in the system.`);
        setErrors((prev) => ({ ...prev, orderNumber: true }));
        return;
      }

      if (form.waybillNumber && form.waybillNumber.trim()) {
        const duplicateWaybill = existingOrders.find(
          (o) => o.waybillNumber.trim().toLowerCase() === form.waybillNumber.trim().toLowerCase()
        );
        if (duplicateWaybill) {
          alert(`Validation Error: An order with Waybill Number "${form.waybillNumber}" already exists in the system.`);
          setErrors((prev) => ({ ...prev, waybillNumber: true }));
          return;
        }
      }

      // ─── New Customer Auto-Save ───
      const cleanedContact = form.contact.trim();
      const cleanNewMobile = cleanPhone(cleanedContact);
      const normNewAddress = normalizeAddress(form.address || "");

      if (cleanNewMobile) {
        // Match contact + address to prevent duplicate customers
        const duplicateCustomer = dbContacts.find((c) => {
          const cleanExtMobile = cleanPhone(c.mobile);
          const normExtAddress = normalizeAddress(c.address1);
          return cleanExtMobile === cleanNewMobile && normExtAddress === normNewAddress;
        });

        if (!duplicateCustomer) {
          const newCustId = `CUST-AUTO-${Date.now()}`;
          const newCust = {
            id: newCustId,
            role: "Customer" as const,
            profileType: "Individual" as const,
            customerType: "New Customer" as const,
            active: true,
            displayName: form.customerName.trim(),
            mobile: cleanedContact,
            address1: form.address || "",
            address1City: form.city || "",
            address1District: form.district || "Colombo",
            notes: "Automatically saved during order placement.",
          };
          addContact(newCust);
        }
      }

      // Construct new order details
      const newOrder = {
        id: `ORD-ADD-${Date.now()}`,
        orderNumber: form.orderNumber,
        customerName: form.customerName,
        address: form.address,
        district: form.district,
        city: form.city,
        contact: form.contact,
        price: Number(form.price),
        paymentMethod: form.paymentMethod,
        courier: form.courier,
        courierBranch: form.courierBranch,
        salesChannel: form.salesChannel,
        salesPerson: form.salesPerson,
        waybillNumber: form.waybillNumber,
        notes: form.notes,
        status: form.status as any, // POS status
        packingStatus: "Ordered", // ALWAYS defaults to 'Ordered' status as requested
        urgentLevel: form.urgentLevel || "none",
        orderedAt: form.orderedAt || getNowDateTimeString(),
        isScheduled: form.isScheduled || false,
        scheduledAt: form.isScheduled ? form.scheduledAt : "",
        createdAt: new Date().toLocaleDateString(),
        lastAction: "Created",
      };

      existingOrders.unshift(newOrder);

      if (typeof window !== "undefined") {
        localStorage.setItem("eeco-care-pos-orders", JSON.stringify(existingOrders));
        // Trigger storage event so that all other pages update
        window.dispatchEvent(new Event("storage"));
      }

      alert(`Order ${form.orderNumber} successfully saved with 'Ordered' status!`);
      setForm(INITIAL);
      setSelectedItems([]);
    }
  };

  const set = (key: string, val: any) => { setForm((f) => ({ ...f, [key]: val })); setErrors((e) => ({ ...e, [key]: false })); };
  const inputCls = (key: string) => cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors", dark ? "border-white/10 bg-slate-800 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500", errors[key] && "border-red-500");
  const labelCls = cn("block text-xs font-medium mb-1.5", dark ? "text-slate-400" : "text-slate-500");

  return (
    <AppShell title="Add Order" description="Create new order with AI paste parser">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          {/* AI Parser */}
          <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 text-white"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold">AI Order Parser</h3>
                <p className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>Paste order text to auto-extract fields</p>
              </div>
            </div>
            <textarea
              className={cn("w-full rounded-xl border p-4 text-sm font-mono min-h-[160px] outline-none transition-colors resize-none", dark ? "border-white/10 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-violet-500")}
              placeholder={`#Order No: 26-225-0531-11\n#Name : John Perera\n#Address : 42 Galle Road, Colombo 04\n#District : Colombo\n#City : Colombo 04\n#Contact : 077 123 4567\n#Total : 15500\n#Payment : COD\n#Courier : Pronto\n#Sales : WhatsApp\n#Notes : Call before delivery`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text.trim()) {
                  const data = parseOrderText(text);
                  const extracted = Object.fromEntries(Object.entries(data).filter(([, v]) => v));
                  if (Object.keys(extracted).length > 0) {
                    setForm((f) => ({ ...f, ...extracted }));
                    setParsed(true);
                    setTimeout(() => setParsed(false), 3000);
                  }
                }
              }}
            />
            <button onClick={handleParse} disabled={!pasteText.trim()} className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2">
              <ClipboardPaste className="h-4 w-4" /> Parse Order
            </button>
            {parsed && <div className="mt-3 rounded-xl bg-emerald-500/15 p-3 text-center text-sm text-emerald-400 font-medium">✓ Fields extracted successfully!</div>}
            {/* Order Number Decoded Breakdown */}
            {form.orderNumber && decodeOrderNumber(form.orderNumber) && (() => {
              const info = decodeOrderNumber(form.orderNumber)!;
              const segments = form.orderNumber.split("-");
              return (
                <div
                  className={cn(
                    "mt-3 rounded-xl border p-4",
                    dark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50/60"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">📋 Order No. Decoded</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3 font-mono text-sm font-bold">
                    <span className={cn("px-1.5 py-0.5 rounded-md", dark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-700")}>{segments[0]}</span>
                    <span className="text-slate-400">-</span>
                    <span className={cn("px-1.5 py-0.5 rounded-md", dark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700")}>{segments[1]}</span>
                    <span className="text-slate-400">-</span>
                    <span className={cn("px-1.5 py-0.5 rounded-md", dark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700")}>{segments[2]}</span>
                    <span className="text-slate-400">-</span>
                    <span className={cn("px-1.5 py-0.5 rounded-md", dark ? "bg-sky-500/20 text-sky-300" : "bg-sky-100 text-sky-700")}>{segments[3]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={cn("rounded-lg px-2.5 py-2 border", dark ? "border-violet-500/15 bg-violet-500/5" : "border-violet-200/60 bg-violet-50/50")}>
                      <div className={cn("text-[9px] font-bold uppercase tracking-wider", dark ? "text-violet-400/70" : "text-violet-500/70")}>Year</div>
                      <div className={cn("text-sm font-bold", dark ? "text-violet-300" : "text-violet-700")}>{info.year}</div>
                    </div>
                    <div className={cn("rounded-lg px-2.5 py-2 border", dark ? "border-emerald-500/15 bg-emerald-500/5" : "border-emerald-200/60 bg-emerald-50/50")}>
                      <div className={cn("text-[9px] font-bold uppercase tracking-wider", dark ? "text-emerald-400/70" : "text-emerald-500/70")}>Monthly Order #</div>
                      <div className={cn("text-sm font-bold", dark ? "text-emerald-300" : "text-emerald-700")}>#{info.monthlyOrder} this month</div>
                    </div>
                    <div className={cn("rounded-lg px-2.5 py-2 border", dark ? "border-amber-500/15 bg-amber-500/5" : "border-amber-200/60 bg-amber-50/50")}>
                      <div className={cn("text-[9px] font-bold uppercase tracking-wider", dark ? "text-amber-400/70" : "text-amber-500/70")}>Ordered Date</div>
                      <div className={cn("text-sm font-bold", dark ? "text-amber-300" : "text-amber-700")}>{info.fullDate}</div>
                    </div>
                    <div className={cn("rounded-lg px-2.5 py-2 border", dark ? "border-sky-500/15 bg-sky-500/5" : "border-sky-200/60 bg-sky-50/50")}>
                      <div className={cn("text-[9px] font-bold uppercase tracking-wider", dark ? "text-sky-400/70" : "text-sky-500/70")}>Daily Order #</div>
                      <div className={cn("text-sm font-bold", dark ? "text-sky-300" : "text-sky-700")}>#{info.dailyOrder} today</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Easy Item Selection */}
          <div className={cn("rounded-3xl border p-5 flex flex-col justify-between", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 text-white"><Boxes className="h-4 w-4" /></div>
                <div>
                  <h3 className="font-semibold">Easy Item Selection</h3>
                  <p className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>Quickly add items and compute order totals</p>
                </div>
              </div>

              {/* Premium Tab Switcher */}
              <div className={cn("grid grid-cols-2 gap-1 p-1 rounded-2xl mb-4 border", dark ? "bg-slate-950/40 border-white/5" : "bg-slate-100 border-slate-200")}>
                <button
                  type="button"
                  onClick={() => setActiveTab("products")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.97]",
                    activeTab === "products"
                      ? (dark ? "bg-slate-800 text-white shadow-md shadow-slate-950/50 border border-white/5" : "bg-white text-slate-900 shadow-sm border border-slate-200/50")
                      : "text-slate-400 hover:text-slate-300"
                  )}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Standard Products
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("packages")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.97]",
                    activeTab === "packages"
                      ? (dark ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-400 border border-violet-500/20" : "bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-600 border border-violet-100")
                      : "text-slate-400 hover:text-slate-300"
                  )}
                >
                  <Gift className="h-3.5 w-3.5" />
                  Special Packages
                </button>
              </div>

              {/* Standard Products Tab content */}
              {activeTab === "products" && (
                <>
                  {/* Product Search */}
                  <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5 mb-4 transition-colors", dark ? "border-white/10 bg-slate-800 focus-within:border-violet-500" : "border-slate-200 bg-slate-50 focus-within:border-violet-500")}>
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white text-slate-900"
                      placeholder="Type to search globally instantly..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {productSearch && (
                      <button onClick={() => setProductSearch("")} className="text-slate-400 hover:text-slate-300 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Directory Navigator Header */}
                  {!productSearch && (
                    <div className="flex items-center justify-between mb-3 border-b pb-2 dark:border-white/5 border-slate-100 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        {(activeCategory || activeSubcategory) && (
                          <button 
                            type="button"
                            onClick={() => {
                              if (activeSubcategory) setActiveSubcategory(null);
                              else setActiveCategory(null);
                            }}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90",
                              dark ? "border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                            )}
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {!activeCategory ? "Select Category" : !activeSubcategory ? "Select Subcategory" : "Select Items"}
                        </span>
                      </div>
                      
                      {/* Reset categories link */}
                      {(activeCategory || activeSubcategory) && (
                        <button 
                          type="button"
                          onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
                          className="text-[10px] font-bold text-violet-500 hover:text-violet-600 uppercase tracking-wider transition-colors"
                        >
                          Back to All
                        </button>
                      )}
                    </div>
                  )}

                  {/* Breadcrumb row */}
                  {!productSearch && (activeCategory || activeSubcategory) && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400/80 mb-3 bg-slate-500/5 px-2.5 py-1.5 rounded-lg w-max max-w-full truncate animate-fadeIn">
                      <span 
                        className="cursor-pointer hover:text-violet-500 transition-colors"
                        onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
                      >
                        All
                      </span>
                      {activeCategory && (
                        <>
                          <span>/</span>
                          <span 
                            className={cn("cursor-pointer hover:text-violet-500 transition-colors", !activeSubcategory && "text-violet-600 dark:text-violet-400 font-extrabold")}
                            onClick={() => { setActiveSubcategory(null); }}
                          >
                            {activeCategory}
                          </span>
                        </>
                      )}
                      {activeSubcategory && (
                        <>
                          <span>/</span>
                          <span className="text-violet-600 dark:text-violet-400 font-extrabold truncate">
                            {activeSubcategory}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* LEVEL 1: Category Grid */}
                  {!productSearch && activeCategory === null && (
                    <div className="grid grid-cols-2 gap-3 mb-4 animate-fadeIn">
                      {["Groceries", "Beverages", "Dairy", "Snacks"].map((cat) => {
                        const emojis: Record<string, string> = { Groceries: "🌾", Beverages: "☕", Dairy: "🧀", Snacks: "🍪" };
                        return (
                          <div
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setActiveSubcategory(null); }}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-md active:scale-95 group",
                              dark 
                                ? "border-white/5 bg-slate-800/40 hover:bg-slate-800 hover:border-violet-500/40" 
                                : "border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300"
                            )}
                          >
                            <span className="text-2xl mb-1.5 transition-transform duration-300 group-hover:scale-110">{emojis[cat]}</span>
                            <span className="font-bold text-xs">{cat}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LEVEL 2: Subcategory List */}
                  {!productSearch && activeCategory !== null && activeSubcategory === null && (
                    <div className="grid grid-cols-2 gap-3 mb-4 animate-fadeIn">
                      {Array.from(new Set(ENRICHED_PRODUCTS.filter(p => p.category === activeCategory).map(p => p.subcategory))).map((sub) => (
                        <div
                          key={sub}
                          onClick={() => setActiveSubcategory(sub)}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-sm active:scale-95 group",
                            dark 
                              ? "border-white/5 bg-slate-800/40 hover:bg-slate-800 hover:border-violet-500/40" 
                              : "border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300"
                          )}
                        >
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{sub}</span>
                          <span className="text-[10px] text-violet-500 font-bold transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LEVEL 3: Items Grid list */}
                  {!productSearch && activeCategory !== null && activeSubcategory !== null && (
                    <div className="max-h-[160px] overflow-y-auto mb-4 border rounded-xl p-2 space-y-1.5 dark:border-white/5 border-slate-100 scrollbar-thin animate-fadeIn">
                      {ENRICHED_PRODUCTS
                        .filter((p) => p.category === activeCategory && p.subcategory === activeSubcategory)
                        .map((prod) => {
                          const scaledPrice = Math.round((prod.price || 0) * 100);
                          return (
                            <div
                              key={prod.sku}
                              onClick={() => handleAddItem(prod)}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]",
                                dark ? "bg-slate-800/40 hover:bg-slate-800 hover:text-white" : "bg-slate-100/40 hover:bg-slate-100 hover:shadow-sm"
                              )}
                            >
                              <div>
                                <div className="font-semibold text-xs">{prod.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.sku} • Stock: {prod.stock}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-xs">Rs. {scaledPrice.toLocaleString()}</div>
                                <div className="text-[9px] text-violet-500 dark:text-violet-400 font-bold uppercase mt-0.5">Click to Add</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Search override display */}
                  {productSearch && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center justify-between mb-2 border-b pb-2 dark:border-white/5 border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Results</span>
                        <button 
                          type="button"
                          onClick={() => setProductSearch("")}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-600 uppercase tracking-wider transition-colors"
                        >
                          Clear Search
                        </button>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto mb-4 border rounded-xl p-2 space-y-1.5 dark:border-white/5 border-slate-100 scrollbar-thin">
                        {ENRICHED_PRODUCTS
                          .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                          .map((prod) => {
                            const scaledPrice = Math.round((prod.price || 0) * 100);
                            return (
                              <div
                                key={prod.sku}
                                onClick={() => handleAddItem(prod)}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]",
                                  dark ? "bg-slate-800/40 hover:bg-slate-800 hover:text-white" : "bg-slate-100/40 hover:bg-slate-100 hover:shadow-sm"
                                )}
                              >
                                <div>
                                  <div className="font-semibold text-xs">{prod.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.sku} • {prod.category}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-xs">Rs. {scaledPrice.toLocaleString()}</div>
                                  <div className="text-[9px] text-violet-500 dark:text-violet-400 font-bold uppercase mt-0.5">Click to Add</div>
                                </div>
                              </div>
                            );
                          })}
                        {ENRICHED_PRODUCTS.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                          <div className="text-center text-xs text-slate-400 py-6 font-medium">No products found</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Special Packages Tab content */}
              {activeTab === "packages" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between mb-1 border-b pb-2 dark:border-white/5 border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Special Packages</span>
                    <span className="text-[10px] text-violet-500 font-extrabold uppercase tracking-wider">Promo Offer</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {specialPackages.map((pkg) => (
                      <div
                        key={pkg.code}
                        className={cn(
                          "rounded-2xl border p-4 transition-all duration-300 hover:shadow-md border-slate-200 bg-slate-50/50 hover:bg-white dark:border-white/5 dark:bg-slate-800/20 dark:hover:bg-slate-800/40 relative overflow-hidden group"
                        )}
                      >
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/10 to-fuchsia-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
                        
                        <div className="flex items-start justify-between gap-4 mb-2.5 relative z-10">
                          <div>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", dark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600")}>
                              {pkg.code}
                            </span>
                            <h4 className="font-bold text-sm mt-1 text-slate-900 dark:text-white">{pkg.name}</h4>
                            <p className={cn("text-[11px] mt-1 leading-relaxed", dark ? "text-slate-400" : "text-slate-500")}>
                              {pkg.description}
                            </p>
                          </div>
                        </div>

                        {/* Components list */}
                        <div className={cn("rounded-xl p-2.5 mb-3 border relative z-10 flex flex-wrap gap-1.5", dark ? "bg-slate-900/60 border-white/5" : "bg-slate-100/60 border-slate-200/50")}>
                          {pkg.items.map((item) => (
                            <span
                              key={item.sku}
                              className={cn(
                                "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                                dark
                                  ? "bg-slate-800/80 border-white/5 text-slate-300"
                                  : "bg-white border-slate-200 text-slate-700 shadow-sm"
                              )}
                            >
                              {item.name} <span className="text-violet-500 dark:text-violet-400 font-extrabold ml-1">x{item.qty}</span>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-extrabold text-emerald-500">
                                Rs. {pkg.packagePrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400 line-through font-medium">
                                Rs. {pkg.originalPrice.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider block mt-0.5">
                              Save Rs. {(pkg.originalPrice - pkg.packagePrice).toLocaleString()}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleAddPackage(pkg)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 active:scale-95 text-xs font-semibold text-white transition shadow-md shadow-violet-600/10"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Package
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Items Breakdown */}
              {selectedItems.length > 0 && (
                <div className="space-y-2 border-t pt-4 dark:border-white/5 border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Selected Items</h4>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
                    {selectedItems.map((item) => (
                      <div
                        key={item.sku}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border",
                          dark ? "border-white/5 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-semibold text-xs truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Rs. {item.price.toLocaleString()} each</div>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQty(item.sku)}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-lg border transition active:scale-90",
                              dark ? "border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-950"
                            )}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQty(item.sku)}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-lg border transition active:scale-90",
                              dark ? "border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-950"
                            )}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.sku)}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition active:scale-90 ml-1.5"
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtotal Footer */}
            {selectedItems.length > 0 && (
              <div className="mt-4 border-t pt-3 flex items-center justify-between dark:border-white/5 border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subtotal Price</span>
                <span className="text-base font-extrabold text-emerald-500">
                  Rs. {selectedItems.reduce((acc, item) => acc + item.price * item.qty, 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Form */}
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Order Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Order Number *</label><input className={inputCls("orderNumber")} value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} placeholder="ORD-XXXX" /></div>
            <div><label className={labelCls}>Customer Name *</label><input className={inputCls("customerName")} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Address</label><textarea className={cn(inputCls("address"), "resize-none")} rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
            <div><label className={labelCls}>District</label><select className={inputCls("district")} value={form.district} onChange={(e) => set("district", e.target.value)}><option value="">Select District</option>{DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className={labelCls}>City</label><input className={inputCls("city")} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className={labelCls}>Contact *</label><input className={inputCls("contact")} value={form.contact} onChange={(e) => set("contact", e.target.value)} /></div>
            <div><label className={labelCls}>Total Price *</label><input className={inputCls("price")} type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
            <div><label className={labelCls}>Payment Method</label><select className={inputCls("paymentMethod")} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}><option value="COD">COD</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option></select></div>
            <div><label className={labelCls}>Courier</label><select className={inputCls("courier")} value={form.courier} onChange={(e) => set("courier", e.target.value)}><option value="">Select Courier</option>{COURIERS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className={labelCls}>Courier Branch</label><input className={inputCls("courierBranch")} value={form.courierBranch} onChange={(e) => set("courierBranch", e.target.value)} /></div>
            <div><label className={labelCls}>Sales Channel</label><select className={inputCls("salesChannel")} value={form.salesChannel} onChange={(e) => set("salesChannel", e.target.value)}><option value="WhatsApp">WhatsApp</option><option value="Facebook">Facebook</option><option value="Messenger">Messenger</option><option value="Website">Website</option></select></div>
            <div>
              <label className={labelCls}>Sales Person</label>
              <select className={inputCls("salesPerson")} value={form.salesPerson} onChange={(e) => set("salesPerson", e.target.value)}>
                <option value="">Select Sales Person</option>
                {users.map((u) => u.shortName && (
                  <option key={u.id} value={u.shortName}>
                    {u.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div><label className={labelCls}>Waybill Number</label><input className={inputCls("waybillNumber")} value={form.waybillNumber} onChange={(e) => set("waybillNumber", e.target.value)} /></div>
            <div><label className={labelCls}>Status</label><select className={inputCls("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>{ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            
            <div>
              <label className={labelCls}>Urgency Level</label>
              <select className={inputCls("urgentLevel")} value={form.urgentLevel} onChange={(e) => set("urgentLevel", e.target.value)}>
                <option value="none">None (Standard)</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className={labelCls}>Ordered Date & Time</label>
              <input type="datetime-local" className={inputCls("orderedAt")} value={form.orderedAt} onChange={(e) => set("orderedAt", e.target.value)} />
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 py-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold select-none">
                <input
                  type="checkbox"
                  checked={form.isScheduled}
                  onChange={(e) => {
                    set("isScheduled", e.target.checked);
                    if (e.target.checked && !form.scheduledAt) {
                      set("scheduledAt", getNowDateTimeString());
                    }
                  }}
                  className="rounded border-slate-300 dark:border-white/10 bg-transparent text-violet-600 focus:ring-violet-500 h-4.5 w-4.5 cursor-pointer"
                />
                <span className={dark ? "text-slate-200" : "text-slate-800"}>Schedule this Order for Delivery</span>
              </label>

              {form.isScheduled && (
                <div className="flex-1 animate-fadeIn">
                  <label className={labelCls}>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    className={inputCls("scheduledAt")}
                    value={form.scheduledAt}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2"><label className={labelCls}>Notes</label><textarea className={cn(inputCls("notes"), "resize-none")} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"><Save className="h-4 w-4" /> Save Order</button>
            <button onClick={() => { setForm(INITIAL); setErrors({}); setSelectedItems([]); setActiveCategory(null); setActiveSubcategory(null); }} className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}><RotateCcw className="h-4 w-4" /> Clear</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
