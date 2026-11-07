import cds from "@sap/cds";

export default class CatalogService extends cds.ApplicationService {
	async init() {
		const {
			Vendors,
			VendorOnboardingRequests,
			VendorDocuments,
			VendorApprovals,
		} = this.entities;

		// --- Helper: Dynamic Action Visibility Flags for Onboarding ---
		const setOnboardingFlags = (r) => {
			if (!r) return;
			const status = (r.status || "DRAFT").toUpperCase();
			r.isSubmitAllowed = status === "DRAFT";
			r.isReviewAllowed = status === "SUBMITTED";
			r.isApproveAllowed = status === "UNDER_REVIEW" || status === "SUBMITTED";
			r.isRejectAllowed = status === "UNDER_REVIEW" || status === "SUBMITTED";
		};

		const getEntityId = (req) => {
			if (typeof req.params?.[0] === "object" && req.params[0]?.ID)
				return req.params[0].ID;
			if (typeof req.params?.[0] === "string") return req.params[0];
			if (req.data?.ID) return req.data.ID;
			if (typeof req.subject === "string") return req.subject;
			return null;
		};

		// --- Hook 1: Populate Dynamic Flags on READ ---
		this.after("READ", VendorOnboardingRequests, (data) => {
			if (Array.isArray(data)) {
				data.forEach(setOnboardingFlags);
			} else {
				setOnboardingFlags(data);
			}
		});

		// --- Hook 2: Defaults for New Draft Onboarding Request ---
		this.before("NEW", VendorOnboardingRequests.drafts, async (req) => {
			req.data.ID = req.data.ID || cds.utils.uuid();
			req.data.status = req.data.status || "DRAFT";
			req.data.criticality = 0;
			req.data.currency = req.data.currency || "USD";
			req.data.paymentTerms = req.data.paymentTerms || "Net 30";
			req.data.requestNumber = await this._generateRequestNumber();
			setOnboardingFlags(req.data);
		});

		// --- Hook 3: Validations Before Saving ---
		this.before("SAVE", VendorOnboardingRequests, async (req) => {
			const data = req.data;
			if (!data.ID) data.ID = cds.utils.uuid();

			if (!data.companyName || data.companyName.trim() === "") {
				req.error(400, "Company Name is required.", "in/companyName");
			}
			if (!data.contactPerson || data.contactPerson.trim() === "") {
				req.error(400, "Contact Person is required.", "in/contactPerson");
			}
			if (!data.email || data.email.trim() === "") {
				req.error(400, "Email address is required.", "in/email");
			} else {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(data.email.trim())) {
					req.error(400, "Invalid email address format.", "in/email");
				}
			}
			if (!data.taxId || data.taxId.trim() === "") {
				req.error(
					400,
					"Tax Identification Number (TIN/GSTIN) is required.",
					"in/taxId",
				);
			}
			if (!data.requestNumber || data.requestNumber.trim() === "") {
				data.requestNumber = await this._generateRequestNumber();
			}

			data.status = (data.status || "DRAFT").trim().toUpperCase();
			data.criticality = this._getOnboardingCriticality(data.status);
			setOnboardingFlags(data);
		});

		// --- Action 1: Submit For Approval ---
		this.on("submitForApproval", VendorOnboardingRequests, async (req) => {
			const requestId = getEntityId(req);
			const current = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			if (!current) return req.error(404, "Request not found.");
			if (current.status !== "DRAFT") {
				return req.error(
					400,
					`Cannot submit request in status '${current.status}'. Must be in 'DRAFT'.`,
				);
			}

			const now = new Date().toISOString();
			await UPDATE(VendorOnboardingRequests, requestId).with({
				status: "SUBMITTED",
				criticality: 2,
				submittedAt: now,
			});

			await INSERT.into(VendorApprovals).entries({
				ID: cds.utils.uuid(),
				onboardingRequest_ID: requestId,
				approverRole: "APPLICANT",
				approverName: current.contactPerson || "Vendor Representative",
				decision: "SUBMITTED",
				comments:
					"Onboarding registration submitted for corporate compliance verification.",
				decisionTimestamp: now,
			});

			const updated = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			setOnboardingFlags(updated);
			return updated;
		});

		// --- Action 2: Review Request ---
		this.on("reviewRequest", VendorOnboardingRequests, async (req) => {
			const requestId = getEntityId(req);
			const current = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			if (!current) return req.error(404, "Request not found.");
			if (current.status !== "SUBMITTED") {
				return req.error(
					400,
					`Cannot review request with status '${current.status}'. Must be 'SUBMITTED'.`,
				);
			}

			const now = new Date().toISOString();
			const reviewer = req.user?.id || "Procurement Officer";
			await UPDATE(VendorOnboardingRequests, requestId).with({
				status: "UNDER_REVIEW",
				criticality: 2,
				reviewedAt: now,
				reviewedBy: reviewer,
			});

			await INSERT.into(VendorApprovals).entries({
				ID: cds.utils.uuid(),
				onboardingRequest_ID: requestId,
				approverRole: "PROCUREMENT_OFFICER",
				approverName: reviewer,
				decision: "REVIEW_STARTED",
				comments: "Procurement team has initiated document verification.",
				decisionTimestamp: now,
			});

			const updated = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			setOnboardingFlags(updated);
			return updated;
		});

		// --- Action 3: Approve Request (AUTOMATIC PROMOTION ENGINE) ---
		this.on("approveRequest", VendorOnboardingRequests, async (req) => {
			const requestId = getEntityId(req);
			const current = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			if (!current) return req.error(404, "Request not found.");
			if (current.status !== "SUBMITTED" && current.status !== "UNDER_REVIEW") {
				return req.error(
					400,
					`Cannot approve request with status '${current.status}'.`,
				);
			}

			const now = new Date().toISOString();
			const approver = req.user?.id || "Procurement Manager";
			const comments = req.data.comments || "Vendor onboarding approved.";

			// 1. Generate Next Vendor Code & Create Active Vendor Directory Row
			const vendorCode = await this._generateVendorCode();
			const newVendorId = cds.utils.uuid();
			const encodedName = encodeURIComponent(current.companyName.trim());

			await INSERT.into(Vendors).entries({
				ID: newVendorId,
				vendorCode: vendorCode,
				name: current.companyName,
				contactPerson: current.contactPerson,
				email: current.email,
				phone: current.phone,
				website: current.website,
				street: current.street,
				city: current.city,
				region: current.region,
				postalCode: current.postalCode,
				country: current.country,
				category: current.category,
				taxId: current.taxId,
				registrationNumber: current.registrationNumber,
				currency: current.currency || "USD",
				paymentTerms: current.paymentTerms || "Net 30",
				status: "ACTIVE",
				criticality: 3,
				onboardingDate: now.slice(0, 10),
				logoUrl: `https://ui-avatars.com/api/?name=${encodedName}&background=0284c7&color=ffffff&size=128&bold=true`,
				onboardingRequest_ID: requestId,
			});

			// 2. Link Uploaded Documents to the New Vendor
			await UPDATE(VendorDocuments)
				.set({ vendor_ID: newVendorId, verificationStatus: "VERIFIED" })
				.where({ onboardingRequest_ID: requestId });

			// 3. Update Request Status to APPROVED
			await UPDATE(VendorOnboardingRequests, requestId).with({
				status: "APPROVED",
				criticality: 3,
				vendor_ID: newVendorId,
				reviewedAt: now,
				reviewedBy: approver,
			});

			// 4. Log Immutable Manager Approval
			await INSERT.into(VendorApprovals).entries({
				ID: cds.utils.uuid(),
				onboardingRequest_ID: requestId,
				approverRole: "PROCUREMENT_MANAGER",
				approverName: approver,
				decision: "APPROVED",
				comments: comments,
				decisionTimestamp: now,
			});

			const updated = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			setOnboardingFlags(updated);
			return updated;
		});

		// --- Action 4: Reject Request ---
		this.on("rejectRequest", VendorOnboardingRequests, async (req) => {
			const requestId = getEntityId(req);
			const current = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			if (!current) return req.error(404, "Request not found.");
			if (current.status !== "SUBMITTED" && current.status !== "UNDER_REVIEW") {
				return req.error(
					400,
					`Cannot reject request with status '${current.status}'.`,
				);
			}

			const now = new Date().toISOString();
			const reason =
				req.data.rejectionReason || "Vendor failed compliance criteria.";
			const approver = req.user?.id || "Procurement Manager";

			await UPDATE(VendorOnboardingRequests, requestId).with({
				status: "REJECTED",
				criticality: 1,
				rejectionReason: reason,
				reviewedAt: now,
				reviewedBy: approver,
			});

			await INSERT.into(VendorApprovals).entries({
				ID: cds.utils.uuid(),
				onboardingRequest_ID: requestId,
				approverRole: "PROCUREMENT_MANAGER",
				approverName: approver,
				decision: "REJECTED",
				comments: reason,
				decisionTimestamp: now,
			});

			const updated = await SELECT.one.from(
				VendorOnboardingRequests,
				requestId,
			);
			setOnboardingFlags(updated);
			return updated;
		});

		return super.init();
	}

	_getOnboardingCriticality(status) {
		switch (status) {
			case "APPROVED":
				return 3; // Green
			case "SUBMITTED":
			case "UNDER_REVIEW":
				return 2; // Orange
			case "REJECTED":
				return 1; // Red
			case "DRAFT":
			default:
				return 0; // Grey
		}
	}

	async _generateRequestNumber() {
		const { VendorOnboardingRequests } = this.entities;
		const requests = await SELECT.from(VendorOnboardingRequests).columns(
			"requestNumber",
		);
		const year = new Date().getFullYear();
		let maxSeq = 0;
		for (const r of requests) {
			if (r.requestNumber && r.requestNumber.startsWith(`REQ-${year}-`)) {
				const numPart = parseInt(
					r.requestNumber.replace(`REQ-${year}-`, ""),
					10,
				);
				if (!isNaN(numPart) && numPart > maxSeq) maxSeq = numPart;
			}
		}
		return `REQ-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
	}

	async _generateVendorCode() {
		const { Vendors } = this.entities;
		const vendors = await SELECT.from(Vendors).columns("vendorCode");
		let maxSeq = 0;
		for (const v of vendors) {
			if (v.vendorCode && v.vendorCode.startsWith("VEN")) {
				const numPart = parseInt(v.vendorCode.replace("VEN", ""), 10);
				if (!isNaN(numPart) && numPart > maxSeq) maxSeq = numPart;
			}
		}
		return `VEN${String(maxSeq + 1).padStart(3, "0")}`;
	}
}
