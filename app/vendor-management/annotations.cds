using CatalogService as service from '../../srv/catalog-service';

annotate service.Vendors with @(
    // Header Info for Object Page and Dialogs
    UI.HeaderInfo : {
        TypeName : 'Vendor',
        TypeNamePlural : 'Vendors',
        Title : {
            $Type : 'UI.DataField',
            Value : name
        },
        Description : {
            $Type : 'UI.DataField',
            Value : vendorCode
        },
        ImageUrl : logoUrl
    },

    // Header KPI / Status Cards
    UI.HeaderFacets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'HeaderStatus',
            Target : '@UI.DataPoint#Status'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'HeaderCategory',
            Target : '@UI.DataPoint#Category'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'HeaderOnboarding',
            Target : '@UI.DataPoint#OnboardingDate'
        }
    ],

    UI.DataPoint #Status : {
        Value       : status,
        Title       : 'Status',
        Criticality : criticality
    },

    UI.DataPoint #Category : {
        Value : category,
        Title : 'Category'
    },

    UI.DataPoint #OnboardingDate : {
        Value : onboardingDate,
        Title : 'Onboarded'
    },

    // Filter Bar Search Fields
    UI.SelectionFields : [
        vendorCode,
        name,
        category,
        status,
        country
    ],

    // List Report Table
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Vendor ID',
            Value : vendorCode
        },
        {
            $Type : 'UI.DataField',
            Label : 'Vendor Name',
            Value : name
        },
        {
            $Type : 'UI.DataField',
            Label : 'Category',
            Value : category
        },
        {
            $Type : 'UI.DataField',
            Label : 'Contact Person',
            Value : contactPerson
        },
        {
            $Type : 'UI.DataField',
            Label : 'Email Address',
            Value : email
        },
        {
            $Type : 'UI.DataField',
            Label : 'Phone',
            Value : phone
        },
        {
            $Type : 'UI.DataField',
            Label : 'Country',
            Value : country
        },
        {
            $Type       : 'UI.DataField',
            Label       : 'Status',
            Value       : status,
            Criticality : criticality,
            CriticalityRepresentation : #WithoutIcon
        },
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.activateVendor',
            Label         : 'Activate',
            ![@UI.Hidden] : isAlreadyActive
        },
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.deactivateVendor',
            Label         : 'Deactivate',
            ![@UI.Hidden] : isAlreadyInactive
        },
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.blockVendor',
            Label         : 'Block',
            ![@UI.Hidden] : isAlreadyBlocked
        }
    ],

    // Identification (Header Actions for Object Page)
    UI.Identification : [
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.activateVendor',
            Label         : 'Activate Vendor',
            ![@UI.Hidden] : isAlreadyActive
        },
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.deactivateVendor',
            Label         : 'Deactivate Vendor',
            ![@UI.Hidden] : isAlreadyInactive
        },
        {
            $Type         : 'UI.DataFieldForAction',
            Action        : 'CatalogService.blockVendor',
            Label         : 'Block Vendor',
            ![@UI.Hidden] : isAlreadyBlocked
        }
    ],

    // Object Page Section Facets
    UI.Facets : [
        {
            $Type  : 'UI.CollectionFacet',
            ID     : 'VendorProfile',
            Label  : 'Vendor Profile',
            Facets : [
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'GeneralInformation',
                    Label  : 'General Information',
                    Target : '@UI.FieldGroup#GeneralInformation'
                },
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'ContactInformation',
                    Label  : 'Contact & Communication',
                    Target : '@UI.FieldGroup#ContactInformation'
                }
            ]
        },
        {
            $Type  : 'UI.CollectionFacet',
            ID     : 'BusinessOperations',
            Label  : 'Business & Location',
            Facets : [
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'AddressInformation',
                    Label  : 'Address Details',
                    Target : '@UI.FieldGroup#AddressInformation'
                },
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'FinancialInformation',
                    Label  : 'Commercial & Tax Details',
                    Target : '@UI.FieldGroup#FinancialInformation'
                }
            ]
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'AuditInformation',
            Label  : 'System & Audit Trail',
            Target : '@UI.FieldGroup#AuditInformation'
        }
    ],

    // Field Groups
    UI.FieldGroup #GeneralInformation : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Label : 'Vendor ID', Value : vendorCode },
            { $Type : 'UI.DataField', Label : 'Company Name', Value : name },
            { $Type : 'UI.DataField', Label : 'Category', Value : category },
            { $Type : 'UI.DataField', Label : 'Status', Value : status, Criticality : criticality },
            { $Type : 'UI.DataField', Label : 'Onboarding Date', Value : onboardingDate },
            { $Type : 'UI.DataField', Label : 'Logo URL', Value : logoUrl },
            {
                $Type         : 'UI.DataFieldForAction',
                Action        : 'CatalogService.activateVendor',
                Label         : 'Activate Vendor',
                ![@UI.Hidden] : isAlreadyActive
            },
            {
                $Type         : 'UI.DataFieldForAction',
                Action        : 'CatalogService.deactivateVendor',
                Label         : 'Deactivate Vendor',
                ![@UI.Hidden] : isAlreadyInactive
            },
            {
                $Type         : 'UI.DataFieldForAction',
                Action        : 'CatalogService.blockVendor',
                Label         : 'Block Vendor',
                ![@UI.Hidden] : isAlreadyBlocked
            }
        ]
    },

    UI.FieldGroup #ContactInformation : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Label : 'Contact Person', Value : contactPerson },
            { $Type : 'UI.DataField', Label : 'Email Address', Value : email },
            { $Type : 'UI.DataField', Label : 'Phone Number', Value : phone },
            { $Type : 'UI.DataField', Label : 'Corporate Website', Value : website }
        ]
    },

    UI.FieldGroup #AddressInformation : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Label : 'Street Address', Value : street },
            { $Type : 'UI.DataField', Label : 'City', Value : city },
            { $Type : 'UI.DataField', Label : 'State / Region', Value : region },
            { $Type : 'UI.DataField', Label : 'Postal Code', Value : postalCode },
            { $Type : 'UI.DataField', Label : 'Country', Value : country }
        ]
    },

    UI.FieldGroup #FinancialInformation : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Label : 'Tax Identification No. (TIN / GST)', Value : taxId },
            { $Type : 'UI.DataField', Label : 'Commercial Registration No.', Value : registrationNumber },
            { $Type : 'UI.DataField', Label : 'Operating Currency', Value : currency },
            { $Type : 'UI.DataField', Label : 'Standard Payment Terms', Value : paymentTerms }
        ]
    },

    UI.FieldGroup #AuditInformation : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Label : 'Created On', Value : createdAt },
            { $Type : 'UI.DataField', Label : 'Created By', Value : createdBy },
            { $Type : 'UI.DataField', Label : 'Last Changed On', Value : modifiedAt },
            { $Type : 'UI.DataField', Label : 'Last Changed By', Value : modifiedBy }
        ]
    }
);

annotate service.Vendors with {
    @UI.IsImageUrl : true
    logoUrl;

    name @Common.FieldControl : #Mandatory;

    status @Common.ValueListWithFixedValues : true
           @Common.ValueList : {
               $Type : 'Common.ValueListType',
               CollectionPath : 'Vendors',
               Parameters : [
                   {
                       $Type : 'Common.ValueListParameterInOut',
                       LocalDataProperty : status,
                       ValueListProperty : 'status'
                   }
               ]
           };
};

annotate CatalogService.VendorOnboardingRequests with @(
    // Header Info
    UI.HeaderInfo : {
        TypeName : 'Onboarding Request',
        TypeNamePlural : 'Onboarding Requests',
        Title : { Value : companyName },
        Description : { Value : requestNumber }
    },

    // Header Status KPI Card
    UI.HeaderFacets : [
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#Status' },
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#Category' },
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#SubmittedAt' }
    ],

    UI.DataPoint #Status : {
        Value : status,
        Title : 'Registration Status',
        Criticality : criticality
    },
    UI.DataPoint #Category : { Value : category, Title : 'Category' },
    UI.DataPoint #SubmittedAt : { Value : submittedAt, Title : 'Submitted On' },

    // Filter Bar
    UI.SelectionFields : [ requestNumber, companyName, category, status, country ],

    // List Report Table
    UI.LineItem : [
        { $Type : 'UI.DataField', Label : 'Request #', Value : requestNumber },
        { $Type : 'UI.DataField', Label : 'Company Name', Value : companyName },
        { $Type : 'UI.DataField', Label : 'Category', Value : category },
        { $Type : 'UI.DataField', Label : 'Contact Person', Value : contactPerson },
        { $Type : 'UI.DataField', Label : 'Email', Value : email },
        { $Type : 'UI.DataField', Label : 'Status', Value : status, Criticality : criticality },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'CatalogService.submitForApproval',
            Label : 'Submit',
            ![@UI.Hidden] : isSubmitAllowed // Inverted dynamically
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'CatalogService.approveRequest',
            Label : 'Approve',
            ![@UI.Hidden] : isApproveAllowed
        }
    ],

    // Object Page Facets (Including Documents & Approvals tables!)
    UI.Facets : [
        {
            $Type : 'UI.CollectionFacet',
            ID : 'GeneralProfile',
            Label : 'Company Profile',
            Facets : [
                { $Type : 'UI.ReferenceFacet', Label : 'Basic Information', Target : '@UI.FieldGroup#BasicInfo' },
                { $Type : 'UI.ReferenceFacet', Label : 'Address & Location', Target : '@UI.FieldGroup#AddressInfo' }
            ]
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'DocumentsSection',
            Label : 'Compliance Documents',
            Target : 'documents/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'ApprovalsSection',
            Label : 'Approval History',
            Target : 'approvals/@UI.LineItem'
        }
    ],

    UI.FieldGroup #BasicInfo : {
        $Type : 'UI.FieldGroupType',
        Data : [
            { $Type : 'UI.DataField', Label : 'Request Number', Value : requestNumber },
            { $Type : 'UI.DataField', Label : 'Company Name', Value : companyName },
            { $Type : 'UI.DataField', Label : 'Contact Person', Value : contactPerson },
            { $Type : 'UI.DataField', Label : 'Email Address', Value : email },
            { $Type : 'UI.DataField', Label : 'Phone Number', Value : phone },
            { $Type : 'UI.DataField', Label : 'Tax Identification Number', Value : taxId }
        ]
    },

    UI.FieldGroup #AddressInfo : {
        $Type : 'UI.FieldGroupType',
        Data : [
            { $Type : 'UI.DataField', Label : 'Street', Value : street },
            { $Type : 'UI.DataField', Label : 'City', Value : city },
            { $Type : 'UI.DataField', Label : 'Postal Code', Value : postalCode },
            { $Type : 'UI.DataField', Label : 'Country', Value : country }
        ]
    }
);

// Annotations for Child Table: VendorDocuments
annotate CatalogService.VendorDocuments with @(
    UI.LineItem : [
        { $Type : 'UI.DataField', Label : 'Document Type', Value : docType },
        { $Type : 'UI.DataField', Label : 'File Name', Value : fileName },
        { $Type : 'UI.DataField', Label : 'Verification Status', Value : verificationStatus },
        { $Type : 'UI.DataField', Label : 'Uploaded At', Value : uploadedAt }
    ]
);

// Annotations for Child Table: VendorApprovals
annotate CatalogService.VendorApprovals with @(
    UI.LineItem : [
        { $Type : 'UI.DataField', Label : 'Decision', Value : decision },
        { $Type : 'UI.DataField', Label : 'Role', Value : approverRole },
        { $Type : 'UI.DataField', Label : 'Approver Name', Value : approverName },
        { $Type : 'UI.DataField', Label : 'Comments', Value : comments },
        { $Type : 'UI.DataField', Label : 'Timestamp', Value : decisionTimestamp }
    ]
);