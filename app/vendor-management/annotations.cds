
using CatalogService as service from '../../srv/catalog-service';

annotate service.Vendors with @(
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

    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            { $Type : 'UI.DataField', Label : 'Vendor ID', Value : vendorCode },
            { $Type : 'UI.DataField', Label : 'Vendor Name', Value : name },
            { $Type : 'UI.DataField', Label : 'Email Address', Value : email },
            { $Type : 'UI.DataField', Label : 'Phone Number', Value : phone },
            { $Type : 'UI.DataField', Label : 'Vendor Status', Value : status }
        ]
    },

    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneralInformation',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup'
        }
    ],

    UI.LineItem : [
        { $Type : 'UI.DataField', Label : 'Vendor ID', Value : vendorCode },
        { $Type : 'UI.DataField', Label : 'Vendor Name', Value : name },
        { $Type : 'UI.DataField', Label : 'Email Address', Value : email },
        { $Type : 'UI.DataField', Label : 'Phone Number', Value : phone },
        { $Type : 'UI.DataField', Label : 'Vendor Status', Value : status }
    ],

    UI.SelectionFields : [
        vendorCode,
        name,
        status
    ]
);

annotate service.Vendors with {
    @UI.IsImageUrl : true
    logoUrl;
};
