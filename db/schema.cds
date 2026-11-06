namespace epvms;

using { cuid, managed } from '@sap/cds/common';

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

    // Dynamic UI Control Flags (Computed at Runtime)
    virtual isAlreadyActive     : Boolean;
    virtual isAlreadyInactive   : Boolean;
    virtual isAlreadyBlocked    : Boolean;
    virtual isActivateAllowed   : Boolean;
    virtual isDeactivateAllowed : Boolean;
    virtual isBlockAllowed      : Boolean;
}
