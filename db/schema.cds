namespace epvms;

using { cuid, managed } from '@sap/cds/common';

// =========================================================================
// 1. MASTER VENDOR DIRECTORY
// =========================================================================
entity Vendors : cuid, managed {
    vendorCode         : String(20);
    name               : String(100);
    contactPerson      : String(100);
    email              : String(150);
    phone              : String(30);
    website            : String(200);
    street             : String(150);
    city               : String(100);
    region             : String(50);
    postalCode         : String(20);
    country            : String(3);
    category           : String(50);
    taxId              : String(50);
    registrationNumber : String(50);
    status             : String(20) default 'ACTIVE';
    currency           : String(3) default 'USD';
    paymentTerms       : String(50) default 'Net 30';
    onboardingDate     : Date;
    logoUrl            : String(500);
    criticality        : Integer default 3;

    // Association to Originating Onboarding Request & Verified Documents
    onboardingRequest  : Association to VendorOnboardingRequests;
    documents          : Association to many VendorDocuments on documents.vendor = $self;

    // Dynamic UI Action Flags (Computed at Runtime)
    virtual isAlreadyActive     : Boolean;
    virtual isAlreadyInactive   : Boolean;
    virtual isAlreadyBlocked    : Boolean;
    virtual isActivateAllowed   : Boolean;
    virtual isDeactivateAllowed : Boolean;
    virtual isBlockAllowed      : Boolean;
}

// =========================================================================
// 2. VENDOR ONBOARDING REQUESTS (Root Entity)
// =========================================================================
entity VendorOnboardingRequests : cuid, managed {
    requestNumber       : String(30); // e.g. REQ-2026-001
    companyName         : String(100);
    contactPerson       : String(100);
    email               : String(150);
    phone               : String(30);
    website             : String(200);
    street              : String(150);
    city                : String(100);
    region              : String(50);
    postalCode          : String(20);
    country             : String(3);
    category            : String(50);
    taxId               : String(50);
    registrationNumber  : String(50);
    currency            : String(3) default 'USD';
    paymentTerms        : String(50) default 'Net 30';
    status              : String(20) default 'DRAFT'; // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    criticality         : Integer default 0;
    businessDescription : String(1000);
    submittedAt         : Timestamp;
    reviewedAt          : Timestamp;
    reviewedBy          : String(255);
    rejectionReason     : String(500);

    // Associated Vendor created upon approval
    vendor              : Association to Vendors;

    // Compositions (Parent-Child ownership)
    documents           : Composition of many VendorDocuments on documents.onboardingRequest = $self;
    approvals           : Composition of many VendorApprovals on approvals.onboardingRequest = $self;

    // Dynamic UI Flags (Controls button visibility)
    virtual isSubmitAllowed  : Boolean;
    virtual isReviewAllowed  : Boolean;
    virtual isApproveAllowed : Boolean;
    virtual isRejectAllowed  : Boolean;
}

// =========================================================================
// 3. VENDOR COMPLIANCE DOCUMENTS
// =========================================================================
entity VendorDocuments : cuid, managed {
    onboardingRequest  : Association to VendorOnboardingRequests;
    vendor             : Association to Vendors;
    docType            : String(50); // TAX_CERTIFICATE, BUSINESS_LICENSE, BANK_DETAILS, ISO_CERTIFICATE, OTHER
    fileName           : String(255);
    mimeType           : String(100);
    fileSize           : Integer;
    fileUrl            : String(1000);
    uploadedAt         : Timestamp;
    verificationStatus : String(20) default 'PENDING'; // PENDING, VERIFIED, REJECTED
    notes              : String(500);
}

// =========================================================================
// 4. ONBOARDING APPROVAL AUDIT LOG
// =========================================================================
entity VendorApprovals : cuid, managed {
    onboardingRequest : Association to VendorOnboardingRequests;
    approverRole      : String(50); // PROCUREMENT_OFFICER, PROCUREMENT_MANAGER, COMPLIANCE_HEAD
    approverName      : String(100);
    approverEmail     : String(150);
    decision          : String(20); // SUBMITTED, REVIEW_STARTED, APPROVED, REJECTED
    comments          : String(1000);
    decisionTimestamp : Timestamp;
}