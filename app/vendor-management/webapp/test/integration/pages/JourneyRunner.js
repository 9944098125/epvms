sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/epvms/vendormanagement/test/integration/pages/VendorsList.gen",
	"com/epvms/vendormanagement/test/integration/pages/VendorsObjectPage.gen"
], function (JourneyRunner, VendorsListGenerated, VendorsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/epvms/vendormanagement') + '/test/flp.html#app-preview',
        pages: {
			onTheVendorsListGenerated: VendorsListGenerated,
			onTheVendorsObjectPageGenerated: VendorsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

