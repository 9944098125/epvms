using {epvms.Vendors as VendorEntity} from '../db/schema';

service CatalogService {
    @odata.draft.enabled
    entity Vendors as projection on VendorEntity actions {
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isActivateAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/isAlreadyActive',
                '_it/isAlreadyInactive',
                '_it/isAlreadyBlocked',
                '_it/isActivateAllowed',
                '_it/isDeactivateAllowed',
                '_it/isBlockAllowed'
            ]
        }
        action activateVendor() returns Vendors;

        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isDeactivateAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/isAlreadyActive',
                '_it/isAlreadyInactive',
                '_it/isAlreadyBlocked',
                '_it/isActivateAllowed',
                '_it/isDeactivateAllowed',
                '_it/isBlockAllowed'
            ]
        }
        action deactivateVendor() returns Vendors;

        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isBlockAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/isAlreadyActive',
                '_it/isAlreadyInactive',
                '_it/isAlreadyBlocked',
                '_it/isActivateAllowed',
                '_it/isDeactivateAllowed',
                '_it/isBlockAllowed'
            ]
        }
        action blockVendor(reason: String) returns Vendors;
    };
}
