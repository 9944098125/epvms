import cds from '@sap/cds';

export default class CatalogService extends cds.ApplicationService {
    async init() {
        const { Vendors } = this.entities;

        const setActionFlags = (v) => {
            if (!v) return;
            const status = (v.status || 'ACTIVE').toUpperCase();
            v.isAlreadyActive   = (status === 'ACTIVE');
            v.isAlreadyInactive = (status === 'INACTIVE');
            v.isAlreadyBlocked  = (status === 'BLOCKED');

            v.isActivateAllowed   = (status !== 'ACTIVE');
            v.isDeactivateAllowed = (status === 'ACTIVE');
            v.isBlockAllowed      = (status !== 'BLOCKED');
        };

        // Populate dynamic action flags on READ
        this.after('READ', Vendors, (data) => {
            if (Array.isArray(data)) {
                data.forEach(setActionFlags);
            } else {
                setActionFlags(data);
            }
        });

        // Pre-fill defaults when creating a new draft vendor
        this.before('NEW', Vendors.drafts, async (req) => {
            req.data.ID = req.data.ID || cds.utils.uuid();
            req.data.status = req.data.status || 'ACTIVE';
            req.data.criticality = 3;
            req.data.currency = req.data.currency || 'USD';
            req.data.paymentTerms = req.data.paymentTerms || 'Net 30';
            req.data.onboardingDate = req.data.onboardingDate || new Date().toISOString().slice(0, 10);
            setActionFlags(req.data);
        });

        // Validation & Auto-generation before saving (Create or Draft Activation)
        this.before('SAVE', Vendors, async (req) => {
            const data = req.data;

            // Ensure UUID is present
            if (!data.ID) {
                data.ID = cds.utils.uuid();
            }

            // 1. Validate Required Fields
            if (!data.name || data.name.trim() === '') {
                req.error(400, 'Vendor Name is required.', 'in/name');
            }

            // 2. Validate Email Format if provided
            if (data.email && data.email.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email.trim())) {
                    req.error(400, 'Invalid email address format.', 'in/email');
                }
            }

            // 3. Auto-generate Vendor Code if omitted
            if (!data.vendorCode || data.vendorCode.trim() === '') {
                data.vendorCode = await this._generateVendorCode();
            } else {
                // Ensure vendorCode uniqueness
                data.vendorCode = data.vendorCode.trim().toUpperCase();
                const existing = await SELECT.one.from(Vendors)
                    .where({ vendorCode: data.vendorCode })
                    .and({ ID: { '!=': data.ID } });
                if (existing) {
                    req.error(409, `Vendor code '${data.vendorCode}' already exists. Please choose a unique code.`, 'in/vendorCode');
                }
            }

            // 4. Normalize Status and Set Criticality
            data.status = (data.status || 'ACTIVE').trim().toUpperCase();
            data.criticality = this._getCriticality(data.status);
            setActionFlags(data);

            // 5. Default Logo if not provided
            if ((!data.logoUrl || data.logoUrl.trim() === '') && data.name) {
                const encodedName = encodeURIComponent(data.name.trim());
                data.logoUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=0284c7&color=ffffff&size=128&bold=true`;
            }

            // 6. Default financial and onboarding attributes
            if (!data.currency) data.currency = 'USD';
            if (!data.paymentTerms) data.paymentTerms = 'Net 30';
            if (!data.onboardingDate) data.onboardingDate = new Date().toISOString().slice(0, 10);
        });

        // Validation on Updates
        this.before('UPDATE', Vendors, async (req) => {
            const data = req.data;

            if (data.name !== undefined && data.name.trim() === '') {
                req.error(400, 'Vendor Name cannot be blank.', 'in/name');
            }

            if (data.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email.trim())) {
                    req.error(400, 'Invalid email address format.', 'in/email');
                }
            }

            if (data.status) {
                data.status = data.status.trim().toUpperCase();
                data.criticality = this._getCriticality(data.status);
                setActionFlags(data);
            }

            if (data.vendorCode) {
                data.vendorCode = data.vendorCode.trim().toUpperCase();
                const existing = await SELECT.one.from(Vendors)
                    .where({ vendorCode: data.vendorCode })
                    .and({ ID: { '!=': req.data.ID || req.params[0]?.ID } });
                if (existing) {
                    req.error(409, `Vendor code '${data.vendorCode}' is already in use by another vendor.`, 'in/vendorCode');
                }
            }
        });

        const getVendorId = (req) => {
            if (typeof req.params?.[0] === 'object' && req.params[0]?.ID) return req.params[0].ID;
            if (typeof req.params?.[0] === 'string') return req.params[0];
            if (req.data?.ID) return req.data.ID;
            if (typeof req.subject === 'string') return req.subject;
            return null;
        };

        // Action: Activate Vendor
        this.on('activateVendor', Vendors, async (req) => {
            const vendorId = getVendorId(req);
            if (!vendorId) return req.error(400, 'Vendor ID is required.');

            await UPDATE(Vendors, vendorId).with({
                status: 'ACTIVE',
                criticality: 3
            });

            req.info('Vendor activated successfully.');
            const vendor = await SELECT.one.from(Vendors, vendorId);
            setActionFlags(vendor);
            return vendor;
        });

        // Action: Deactivate Vendor
        this.on('deactivateVendor', Vendors, async (req) => {
            const vendorId = getVendorId(req);
            if (!vendorId) return req.error(400, 'Vendor ID is required.');

            await UPDATE(Vendors, vendorId).with({
                status: 'INACTIVE',
                criticality: 0
            });

            req.info('Vendor deactivated.');
            const vendor = await SELECT.one.from(Vendors, vendorId);
            setActionFlags(vendor);
            return vendor;
        });

        // Action: Block Vendor
        this.on('blockVendor', Vendors, async (req) => {
            const vendorId = getVendorId(req);
            const reason = req.data.reason || 'Blocked by Procurement Administrator';
            if (!vendorId) return req.error(400, 'Vendor ID is required.');

            await UPDATE(Vendors, vendorId).with({
                status: 'BLOCKED',
                criticality: 1
            });

            req.info(`Vendor blocked. Reason: ${reason}`);
            const vendor = await SELECT.one.from(Vendors, vendorId);
            setActionFlags(vendor);
            return vendor;
        });

        return super.init();
    }

    _getCriticality(status) {
        switch (status) {
            case 'ACTIVE':
                return 3; // Positive (Green)
            case 'PENDING':
            case 'PENDING APPROVAL':
                return 2; // Critical / Warning (Orange)
            case 'BLOCKED':
                return 1; // Negative (Red)
            case 'INACTIVE':
            default:
                return 0; // Neutral (Grey)
        }
    }

    async _generateVendorCode() {
        const { Vendors } = this.entities;
        const vendors = await SELECT.from(Vendors).columns('vendorCode');
        let maxSeq = 0;

        for (const v of vendors) {
            if (v.vendorCode && v.vendorCode.startsWith('VEN')) {
                const numPart = parseInt(v.vendorCode.replace('VEN', ''), 10);
                if (!isNaN(numPart) && numPart > maxSeq) {
                    maxSeq = numPart;
                }
            }
        }

        const nextSeq = maxSeq + 1;
        return `VEN${String(nextSeq).padStart(3, '0')}`;
    }
}
