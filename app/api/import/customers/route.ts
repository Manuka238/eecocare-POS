import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { 
  sriLankaDistricts,
  normalizeHeader,
  headerMap,
  importContactRowSchema,
  type ContactRecord,
  type ContactRole,
  type ProfileType,
  type CustomerType,
  type PayTermUnit,
  parseAddressString,
  getCoordinatesForDistrict,
  checkDuplicateContact,
  cleanPhone,
  normalizeAddress
} from "@/lib/contact-data";
import { readDb, writeDb } from "@/lib/db";

// Sri Lankan phone validation
function isValidSriLankanPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  if (cleaned.length < 9) return false;
  if (cleaned.startsWith("94")) {
    return /^947[01245678]\d{7}$/.test(cleaned);
  }
  if (cleaned.startsWith("0")) {
    return /^07[01245678]\d{7}$/.test(cleaned);
  }
  return /^7[01245678]\d{7}$/.test(cleaned);
}

// Simple email regex
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const db = await readDb();
    const dbContacts = db.contacts;
    let rawRows: any[][] = [];
    let isFileParsed = false;
    let headers: string[] = [];

    // Check content type to see if it's JSON or FormData
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "File exceeds 10MB maximum size" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Parse raw matrix representing sheet rows
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
      if (!grid || grid.length === 0) {
        return NextResponse.json({ success: false, error: "Empty Excel file" }, { status: 400 });
      }

      // Auto-detect header row index and headers
      let headerRowIndex = 0;
      for (let r = 0; r < Math.min(grid.length, 12); r++) {
        const row = grid[r];
        if (!row || !Array.isArray(row)) continue;
        let matchedCount = 0;
        row.forEach(cell => {
          const norm = normalizeHeader(String(cell || ""));
          if (norm && headerMap[norm]) matchedCount++;
        });
        if (matchedCount >= 2) {
          headerRowIndex = r;
          headers = row.map(cell => String(cell || "").trim());
          break;
        }
      }

      // Fallback
      if (headers.length === 0) {
        for (let r = 0; r < grid.length; r++) {
          const row = grid[r];
          if (row && row.some(cell => String(cell || "").trim() !== "")) {
            headerRowIndex = r;
            headers = row.map(cell => String(cell || "").trim());
            break;
          }
        }
      }

      if (headers.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid Excel format" }, { status: 400 });
      }

      // Filter and map grid data rows
      const dataRows = grid.slice(headerRowIndex + 1).filter(row => 
        row && row.some(cell => String(cell || "").trim() !== "")
      );

      if (dataRows.length === 0) {
        return NextResponse.json({ success: false, error: "Empty Excel file" }, { status: 400 });
      }

      rawRows = dataRows.map(rowArr => {
        const rowObj: any = {};
        headers.forEach((header, colIndex) => {
          const cellVal = rowArr[colIndex];
          const norm = normalizeHeader(header);
          const canonical = headerMap[norm];
          if (canonical) {
            rowObj[canonical] = cellVal !== undefined ? String(cellVal).trim() : "";
          } else if (norm) {
            rowObj[norm] = cellVal !== undefined ? String(cellVal).trim() : "";
          }
        });
        return rowObj;
      });

      isFileParsed = true;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      // Already mapped rows from the client
      rawRows = body.contacts || [];
      headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    } else {
      return NextResponse.json({ success: false, error: "Unsupported content type" }, { status: 400 });
    }

    if (!Array.isArray(rawRows)) {
      return NextResponse.json({ success: false, error: "Invalid payload format. Expected contacts array." }, { status: 400 });
    }

    // Dynamic Debug Logs
    const normalizedHeaders = headers.map(h => normalizeHeader(h));
    const matchedColumns: Record<string, string> = {};
    const matchedCanonicalKeys = new Set<string>();
    
    headers.forEach(h => {
      const norm = normalizeHeader(h);
      const canonical = headerMap[norm];
      if (canonical) {
        matchedColumns[h] = canonical;
        matchedCanonicalKeys.add(canonical);
      }
    });

    console.log("Parsed headers:", headers);
    console.log("Normalized headers:", normalizedHeaders);
    console.log("Matched columns:", matchedColumns);
    
    const missingCanonical = ["display_name", "mobile_number"].filter(reqKey => !matchedCanonicalKeys.has(reqKey));
    console.log("Missing columns:", missingCanonical);

    // Validate Required Columns for Customer
    if (contentType.includes("multipart/form-data")) {
      const hasName = matchedCanonicalKeys.has("display_name") || matchedCanonicalKeys.has("full_name");
      const hasPhone = matchedCanonicalKeys.has("mobile_number");
      if (!hasName) {
        return NextResponse.json({ success: false, error: "Missing required column: Customer Name" }, { status: 400 });
      }
      if (!hasPhone) {
        return NextResponse.json({ success: false, error: "Missing required column: Phone Number" }, { status: 400 });
      }
    }

    // Process and validate rows
    const importedContacts: ContactRecord[] = [];
    let totalRows = rawRows.length;
    let duplicateCount = 0;
    let invalidCount = 0;
    let successfulCount = 0;
    
    const errors: ValidationError[] = [];

    // Track internal duplicates within the uploaded batch
    const processedEmails = new Set<string>();
    const processedPhones = new Set<string>();
    const processedPhoneAddresses = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row: any = rawRows[i];
      const rowNum = i + 1;

      // Skip entirely empty rows
      const isEmpty = Object.values(row).every(val => val === null || val === undefined || String(val).trim() === "");
      if (isEmpty) {
        totalRows--;
        continue;
      }

      // 1. Column Normalization with sensible Defaults & Fallbacks
      let role = String(row.contact_role || row.role || "").trim() as ContactRole;
      if (!role) {
        role = "Customer";
      }

      let profileType = String(row.profile_type || row.profileType || "").trim() as ProfileType;
      const businessName = String(row.business_name || row.businessName || "").trim();
      const personTitle = String(row.person_title || row.personTitle || "").trim();
      const fullName = String(row.full_name || row.fullName || "").trim();
      
      if (!profileType) {
        profileType = businessName ? "Business" : "Individual";
      }

      let displayName = String(row.display_name || row.displayName || "").trim();
      if (!displayName) {
        displayName = profileType === "Business" ? businessName : fullName;
      }
      if (!displayName) {
        displayName = "Imported Customer";
      }

      const mobile = String(row.mobile_number || row.mobile || "").trim();
      const alternativeNumber = String(row.alternative_number || row.alternativeNumber || "").trim();
      const landline = String(row.landline_number || row.landline || "").trim();
      const email = String(row.email || "").trim();
      let address1 = String(row.address_01 || row.address1 || "").trim();
      let address1City = String(row.address_01_city || row.address1City || "").trim();
      let address1District = String(row.address_01_district || row.address1District || "").trim();
      const address2 = String(row.address_02 || row.address2 || "").trim();
      const address2City = String(row.address_02_city || row.address2City || "").trim();
      const address2District = String(row.address_02_district || row.address2District || "").trim();
      const postalCode = String(row.postal_code || row.postalCode || "").trim();

      // Get correct City and District from address_01 if missing
      if (address1 && (!address1City || !address1District)) {
        const parsedAddress = parseAddressString(address1);
        if (parsedAddress.district) {
          address1District = parsedAddress.district;
          address1City = parsedAddress.city;
          address1 = parsedAddress.address1;
        }
      }

      // Resolve coordinates for mapping using resolved district
      const coords = getCoordinatesForDistrict(address1District);
      const mapX = coords.mapX;
      const mapY = coords.mapY;
      
      const payTermValue = row.pay_term_value !== undefined && row.pay_term_value !== "" ? Number(row.pay_term_value) : undefined;
      const payTermUnit = String(row.pay_term_unit || row.payTermUnit || "Days").trim() as PayTermUnit;
      const creditLimit = row.credit_limit_lkr !== undefined && row.credit_limit_lkr !== "" ? Number(row.credit_limit_lkr) : undefined;
      const openingBalance = row.opening_balance_lkr !== undefined && row.opening_balance_lkr !== "" ? Number(row.opening_balance_lkr) : undefined;
      const taxNumber = String(row.tax_number || row.taxNumber || "").trim();
      const preferredContactMethod = String(row.preferred_contact_method || row.preferredContactMethod || "Mobile").trim() as any;
      const notes = String(row.notes || "").trim();
      const customField1Name = String(row.custom_field_1_name || "").trim();
      const customField1Value = String(row.custom_field_1_value || "").trim();
      const customField2Name = String(row.custom_field_2_name || "").trim();
      const customField2Value = String(row.custom_field_2_value || "").trim();
      const status = String(row.status || "").trim() || "Active";

      const rowErrors: string[] = [];

      // Safe Zod validations
      const zodPayload = {
        display_name: displayName,
        mobile_number: mobile,
        contact_role: role,
        profile_type: profileType,
        email: email || undefined,
        status,
      };

      const zodResult = importContactRowSchema.safeParse(zodPayload);
      if (!zodResult.success) {
        zodResult.error.issues.forEach(err => rowErrors.push(err.message));
      }

      // Core Field validation
      if (!mobile) {
        rowErrors.push("Mobile number is required.");
      } else if (!isValidSriLankanPhone(mobile)) {
        rowErrors.push(`Mobile number '${mobile}' is not a valid Sri Lankan mobile format.`);
      }

      if (email && !isValidEmail(email)) {
        rowErrors.push("Email address is not valid.");
      }

      if (payTermUnit && payTermUnit !== "Days" && payTermUnit !== "Months") {
        rowErrors.push("Pay term unit must be 'Days' or 'Months'.");
      }

      // If there are validation errors, flag row as invalid and SKIP
      if (rowErrors.length > 0) {
        invalidCount++;
        rowErrors.forEach(err => {
          errors.push({ row: rowNum, field: "Validation", message: err });
        });
        continue;
      }

      // 2. Duplicate Detection
      // Check for internal duplicates (within uploaded file)
      const cleanMob = cleanPhone(mobile);
      const cleanEm = email.toLowerCase();
      
      let isDuplicate = false;

      if (processedPhones.has(cleanMob)) {
        isDuplicate = true;
        errors.push({ row: rowNum, field: "mobile_number", message: `Duplicate mobile number '${mobile}' in upload sheet.` });
      }
      
      const normAddr = normalizeAddress(address1);
      const internalKey = `${cleanMob}_${normAddr}`;
      if (!isDuplicate && normAddr) {
        if (processedPhoneAddresses.has(internalKey)) {
          isDuplicate = true;
          errors.push({ row: rowNum, field: "address_01", message: `Duplicate mobile and address combination in upload sheet.` });
        }
      }
      if (cleanEm && processedEmails.has(cleanEm)) {
        isDuplicate = true;
        errors.push({ row: rowNum, field: "email", message: `Duplicate email '${email}' in upload sheet.` });
      }

      // Check external duplicates (against database using the address and mobile tracking system)
      if (!isDuplicate) {
        const dupCheck = checkDuplicateContact(dbContacts, mobile, address1);
        if (dupCheck.isDuplicate) {
          isDuplicate = true;
          errors.push({ row: rowNum, field: "mobile_number", message: dupCheck.reason });
        }
      }

      if (isDuplicate) {
        duplicateCount++;
        continue; // Skip duplicates
      }

      // Store phone, address & email to check subsequent rows
      processedPhones.add(cleanMob);
      if (normAddr) processedPhoneAddresses.add(internalKey);
      if (cleanEm) processedEmails.add(cleanEm);

      // Create Custom Fields array
      const customFields = [];
      if (customField1Name && customField1Value) {
        customFields.push({ label: customField1Name, value: customField1Value });
      }
      if (customField2Name && customField2Value) {
        customFields.push({ label: customField2Name, value: customField2Value });
      }

      // Generate a mock unique ID if missing
      const finalId = row.contact_id || row.id || `CUST-IMP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Assemble final contact record
      const record: ContactRecord = {
        id: finalId,
        role: "Customer",
        profileType,
        customerType: (row.customer_type || "Regular Customer") as CustomerType,
        active: status === "Active",
        businessName: businessName || undefined,
        personTitle: personTitle || undefined,
        fullName: fullName || undefined,
        displayName,
        mobile,
        alternativeNumber: alternativeNumber || undefined,
        landline: landline || undefined,
        email: email || undefined,
        address1,
        address1City,
        address1District,
        address2: address2 || undefined,
        address2City: address2City || undefined,
        address2District: address2District || undefined,
        postalCode: postalCode || undefined,
        payTermValue,
        payTermUnit,
        openingBalance: openingBalance || 0,
        creditLimit: creditLimit || undefined,
        taxNumber: taxNumber || undefined,
        preferredContactMethod: preferredContactMethod || "Mobile",
        notes: notes || undefined,
        customFields: customFields.length > 0 ? customFields : undefined,
        tags: [],
        purchaseDue: 0,
        returnDue: 0,
        totalPurchases: 0,
        mapX,
        mapY
      };

      importedContacts.push(record);
      successfulCount++;
    }

    // Save successfully imported contacts to persistent store
    if (importedContacts.length > 0) {
      db.contacts = [...importedContacts, ...db.contacts];
      await writeDb(db);
    }

    return NextResponse.json({
      success: true,
      totalRows,
      successfulCount,
      duplicateCount,
      invalidCount,
      importedContacts,
      errors
    });

  } catch (error: any) {
    console.error("Customers import error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process import file" }, { status: 500 });
  }
}
