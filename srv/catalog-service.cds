using {
    epvms.Vendors as VendorEntity,
    epvms.VendorOnboardingRequests as OnboardingEntity,
    epvms.VendorDocuments as DocumentEntity,
    epvms.VendorApprovals as ApprovalEntity
} from '../db/schema';

service CatalogService {

    // 1. Master Vendors (from Module 1)
    @odata.draft.enabled
    entity Vendors as projection on VendorEntity actions {
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isActivateAllowed
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/criticality', '_it/isAlreadyActive', '_it/isAlreadyInactive', '_it/isAlreadyBlocked'] }
        action activateVendor() returns Vendors;

        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isDeactivateAllowed
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/criticality', '_it/isAlreadyActive', '_it/isAlreadyInactive', '_it/isAlreadyBlocked'] }
        action deactivateVendor() returns Vendors;

        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isBlockAllowed
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/criticality', '_it/isAlreadyActive', '_it/isAlreadyInactive', '_it/isAlreadyBlocked'] }
        action blockVendor(reason: String) returns Vendors;
    };

    // 2. Vendor Onboarding Requests (Module 2)
    @odata.draft.enabled
    entity VendorOnboardingRequests as projection on OnboardingEntity actions {
        
        // Applicant submits registration for review
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isSubmitAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/submittedAt',
                '_it/isSubmitAllowed',
                '_it/isReviewAllowed',
                '_it/isApproveAllowed',
                '_it/isRejectAllowed'
            ]
        }
        action submitForApproval() returns VendorOnboardingRequests;

        // Procurement Officer starts compliance verification
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isReviewAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/reviewedAt',
                '_it/reviewedBy',
                '_it/isSubmitAllowed',
                '_it/isReviewAllowed',
                '_it/isApproveAllowed',
                '_it/isRejectAllowed'
            ]
        }
        action reviewRequest() returns VendorOnboardingRequests;

        // Procurement Manager approves -> Creates Active Master Vendor!
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isApproveAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/vendor_ID',
                '_it/isSubmitAllowed',
                '_it/isReviewAllowed',
                '_it/isApproveAllowed',
                '_it/isRejectAllowed'
            ]
        }
        action approveRequest(comments: String) returns VendorOnboardingRequests;

        // Procurement Manager rejects with mandatory reason
        @cds.odata.bindingparameter.name: '_it'
        @Core.OperationAvailable: _it.isRejectAllowed
        @Common.SideEffects: {
            TargetProperties: [
                '_it/status',
                '_it/criticality',
                '_it/rejectionReason',
                '_it/isSubmitAllowed',
                '_it/isReviewAllowed',
                '_it/isApproveAllowed',
                '_it/isRejectAllowed'
            ]
        }
        action rejectRequest(rejectionReason: String) returns VendorOnboardingRequests;
    };

    // 3. Document and Approval Projections
    entity VendorDocuments as projection on DocumentEntity;
    entity VendorApprovals as projection on ApprovalEntity;
}