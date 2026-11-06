import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cds = require('@sap/cds');

async function testVendorModule() {
    process.env.PORT = '4005';
    console.log('====================================================');
    console.log('EPVMS: Vendor Management Module Verification Suite');
    console.log('====================================================\n');

    let server;
    let testVendorId = null;

    try {
        // 1. Start CDS Server
        console.log('[STEP 1] Starting CDS OData V4 Server...');
        server = await cds.server();
        const port = server?.address()?.port || process.env.PORT || 4004;
        console.log(`-> CDS HTTP server listening on http://localhost:${port}\n`);

        const baseUrl = `http://localhost:${port}/odata/v4/catalog`;

        // 2. Test $metadata endpoint
        console.log('[STEP 2] Testing OData V4 $metadata endpoint...');
        const metaRes = await fetch(`${baseUrl}/$metadata`);
        console.log('-> $metadata HTTP Status:', metaRes.status);
        const metaXml = await metaRes.text();
        if (!metaXml.includes('EntitySet Name="Vendors"') || !metaXml.includes('activateVendor')) {
            throw new Error('$metadata does not contain Vendors EntitySet or activateVendor action');
        }
        console.log('-> $metadata verified successfully.\n');

        // 3. Test GET /Vendors
        console.log('[STEP 3] Testing GET /Vendors (OData EntitySet)...');
        const getRes = await fetch(`${baseUrl}/Vendors`);
        console.log('-> GET /Vendors HTTP Status:', getRes.status);
        const getData = await getRes.json();
        console.log(`-> Returned ${getData.value?.length} vendors:`);
        for (const v of getData.value) {
            console.log(`   * [${v.vendorCode}] ${v.name} | Category: ${v.category} | Status: ${v.status} | Criticality: ${v.criticality}`);
        }
        if (getData.value.length < 3) {
            throw new Error(`Expected at least 3 vendors, got ${getData.value.length}`);
        }
        console.log('-> Existing Neon PostgreSQL records retrieved cleanly.\n');

        // 4. Test Validation on Draft Activation with invalid email
        console.log('[STEP 4] Testing Business Validation on draftActivate (Invalid Email)...');
        const badDraftRes = await fetch(`${baseUrl}/Vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Invalid Test Corp', email: 'not-an-email-address' })
        });
        const badDraft = await badDraftRes.json();
        
        // Attempt activation of invalid draft
        const badActivateRes = await fetch(`${baseUrl}/Vendors(ID=${badDraft.ID},IsActiveEntity=false)/CatalogService.draftActivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        console.log('-> Bad draftActivate HTTP Status:', badActivateRes.status, '(Expected 400)');
        const badActivateData = await badActivateRes.json();
        console.log('-> Rejection error message:', badActivateData.error?.message);
        if (badActivateRes.status !== 400) {
            throw new Error(`Expected 400 status for invalid email on activate, got ${badActivateRes.status}`);
        }

        // Clean up invalid draft
        await fetch(`${baseUrl}/Vendors(ID=${badDraft.ID},IsActiveEntity=false)`, { method: 'DELETE' });
        console.log('-> Validation properly rejected invalid payload on draft activation.\n');

        // 5. Test Creation via OData Draft Flow (Create Draft -> Activate)
        console.log('[STEP 5] Testing Fiori Elements Draft Flow (Create Draft -> Activate)...');
        
        // 5a. Create initial draft
        const draftPayload = {
            name: 'Apex Semiconductor Technologies',
            contactPerson: 'Elena Rostova',
            email: 'erostova@apexsemi.example',
            phone: '+1-415-555-0144',
            category: 'Electronics & Components',
            street: '100 Silicon Way',
            city: 'San Jose',
            region: 'CA',
            postalCode: '95134',
            country: 'USA',
            status: 'ACTIVE'
        };

        const createDraftRes = await fetch(`${baseUrl}/Vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draftPayload)
        });
        console.log('-> Create Draft HTTP Status:', createDraftRes.status);
        const draftRecord = await createDraftRes.json();
        testVendorId = draftRecord.ID;
        console.log('   * Created Draft ID:', testVendorId);
        console.log('   * IsActiveEntity:', draftRecord.IsActiveEntity);

        // 5b. Activate Draft (standard Fiori Elements action: draftActivate)
        console.log('   Activating draft via CatalogService.draftActivate...');
        const activateDraftRes = await fetch(`${baseUrl}/Vendors(ID=${testVendorId},IsActiveEntity=false)/CatalogService.draftActivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        console.log('-> draftActivate HTTP Status:', activateDraftRes.status);
        const activeRecord = await activateDraftRes.json();
        console.log('   * Active Entity IsActiveEntity:', activeRecord.IsActiveEntity);
        console.log('   * Active Entity Vendor Code:', activeRecord.vendorCode);
        console.log('   * Active Entity Logo URL:', activeRecord.logoUrl);
        console.log('   * Active Entity Status:', activeRecord.status);
        console.log('   * Active Entity Criticality:', activeRecord.criticality);
        console.log('   * Operating Currency:', activeRecord.currency);
        console.log('   * Payment Terms:', activeRecord.paymentTerms);

        if (!activeRecord.vendorCode?.startsWith('VEN')) {
            throw new Error(`Expected vendorCode to start with VEN, got ${activeRecord.vendorCode}`);
        }
        if (!activeRecord.logoUrl?.includes('ui-avatars.com')) {
            throw new Error('Expected auto-generated UI Avatar logoUrl');
        }
        if (activeRecord.criticality !== 3) {
            throw new Error(`Expected criticality 3 for ACTIVE, got ${activeRecord.criticality}`);
        }
        if (activeRecord.isAlreadyActive !== true || activeRecord.isActivateAllowed !== false) {
            throw new Error(`Expected isAlreadyActive=true and isActivateAllowed=false for ACTIVE vendor`);
        }
        console.log('   * Dynamic UI Flags for ACTIVE: isAlreadyActive = true (Activate Button Hidden)');
        console.log('-> Draft successfully activated into active database record!\n');

        // 6. Test Custom Lifecycle Action: deactivateVendor
        console.log('[STEP 6] Testing Bound Action: deactivateVendor...');
        const deactivateRes = await fetch(`${baseUrl}/Vendors(ID=${testVendorId},IsActiveEntity=true)/CatalogService.deactivateVendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        console.log('-> deactivateVendor HTTP Status:', deactivateRes.status);
        const deactivatedRecord = await deactivateRes.json();
        console.log(`   * Status after deactivation: ${deactivatedRecord.status} (Criticality: ${deactivatedRecord.criticality})`);
        if (deactivatedRecord.status !== 'INACTIVE' || deactivatedRecord.criticality !== 0) {
            throw new Error(`Expected status=INACTIVE and criticality=0, got status=${deactivatedRecord.status}`);
        }
        if (deactivatedRecord.isAlreadyInactive !== true || deactivatedRecord.isDeactivateAllowed !== false) {
            throw new Error(`Expected isAlreadyInactive=true and isDeactivateAllowed=false for INACTIVE vendor`);
        }
        console.log('   * Dynamic UI Flags for INACTIVE: isAlreadyInactive = true (Deactivate Button Hidden)');
        console.log('-> deactivateVendor verified.\n');

        // 7. Test Custom Lifecycle Action: blockVendor
        console.log('[STEP 7] Testing Bound Action: blockVendor...');
        const blockRes = await fetch(`${baseUrl}/Vendors(ID=${testVendorId},IsActiveEntity=true)/CatalogService.blockVendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Audit Pending' })
        });
        console.log('-> blockVendor HTTP Status:', blockRes.status);
        const blockedRecord = await blockRes.json();
        console.log(`   * Status after blocking: ${blockedRecord.status} (Criticality: ${blockedRecord.criticality})`);
        if (blockedRecord.status !== 'BLOCKED' || blockedRecord.criticality !== 1) {
            throw new Error(`Expected status=BLOCKED and criticality=1, got status=${blockedRecord.status}`);
        }
        if (blockedRecord.isAlreadyBlocked !== true || blockedRecord.isBlockAllowed !== false) {
            throw new Error(`Expected isAlreadyBlocked=true and isBlockAllowed=false for BLOCKED vendor`);
        }
        console.log('   * Dynamic UI Flags for BLOCKED: isAlreadyBlocked = true (Block Button Hidden)');
        console.log('-> blockVendor verified.\n');

        // 8. Test Custom Lifecycle Action: activateVendor
        console.log('[STEP 8] Testing Bound Action: activateVendor...');
        const activateRes = await fetch(`${baseUrl}/Vendors(ID=${testVendorId},IsActiveEntity=true)/CatalogService.activateVendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        console.log('-> activateVendor HTTP Status:', activateRes.status);
        const activatedRecord = await activateRes.json();
        console.log(`   * Status after activation: ${activatedRecord.status} (Criticality: ${activatedRecord.criticality})`);
        if (activatedRecord.status !== 'ACTIVE' || activatedRecord.criticality !== 3) {
            throw new Error(`Expected status=ACTIVE and criticality=3, got status=${activatedRecord.status}`);
        }
        if (activatedRecord.isAlreadyActive !== true || activatedRecord.isActivateAllowed !== false) {
            throw new Error(`Expected isAlreadyActive=true and isActivateAllowed=false for ACTIVE vendor`);
        }
        console.log('   * Dynamic UI Flags for ACTIVE: isAlreadyActive = true (Activate Button Hidden)');
        console.log('-> activateVendor verified.\n');

        // 9. Clean up test record via DELETE
        console.log('[STEP 9] Deleting test vendor to keep database clean...');
        const deleteRes = await fetch(`${baseUrl}/Vendors(ID=${testVendorId},IsActiveEntity=true)`, {
            method: 'DELETE'
        });
        console.log('-> DELETE HTTP Status:', deleteRes.status);
        testVendorId = null; // cleaned up
        console.log('-> Test vendor cleanly removed from Neon PostgreSQL.\n');

        console.log('====================================================');
        console.log('🎉 ALL END-TO-END ODATA V4 TESTS PASSED SUCCESSFULLY!');
        console.log('====================================================');

    } catch (err) {
        console.error('OData Verification Error:', err);
        if (testVendorId) {
            try {
                const db = await cds.connect.to('db');
                await db.run(`DELETE FROM epvms_vendors WHERE id = '${testVendorId}'`);
            } catch (e) { /* ignore */ }
        }
        process.exit(1);
    } finally {
        if (server) {
            server.close();
        }
        process.exit(0);
    }
}

testVendorModule();
