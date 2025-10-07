// DEBUG VERSION - Add this at the very beginning of your N8N code to see what's happening

const items = $input.all();
const results = [];

console.log(`🔍 DEBUG: Starting with ${items.length} items`);

// Log the first item structure for debugging
if (items.length > 0) {
    console.log(`📋 DEBUG: First item structure:`, JSON.stringify(items[0], null, 2));
}

// SIMPLIFIED KMRL filter for testing - REPLACE YOUR isKMRLRelated function with this:
function isKMRLRelated(data) {
    console.log(`🔍 DEBUG: Checking email relevance...`);
    console.log(`📧 Subject: "${safeString(data.subject)}"`);
    console.log(`👤 From: "${safeString(data.from)}"`);
    
    // FOR TESTING: Accept ALL emails (remove KMRL filter temporarily)
    console.log(`✅ DEBUG: Accepting ALL emails for testing`);
    return true;
    
    // Original KMRL logic commented out for testing
    /*
    const fromEmail = safeString(data.from).toLowerCase();
    const subject = safeString(data.subject).toLowerCase();
    
    if (fromEmail.includes('kmrl.co.in') || 
        subject.includes('kmrl') || 
        subject.includes('maintenance') ||
        subject.includes('finance')) {
        console.log(`✅ KMRL related content found`);
        return true;
    }
    
    console.log(`❌ Not KMRL related`);
    return false;
    */
}

// Your existing helper functions remain the same...
function safeString(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (value.value && Array.isArray(value.value) && value.value[0]) {
            const addr = value.value[0];
            return addr.name ? `${addr.name} <${addr.address}>` : addr.address;
        }
        if (value.text) return value.text;
        if (value.emailAddress) return value.emailAddress;
        if (value.name) return value.name;
        return String(value);
    }
    return String(value || '');
}

// SIMPLIFIED PROCESSING LOOP
for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const data = item.json;
    const binary = item.binary || {};
    
    console.log(`\n=== Processing Email ${i + 1} ===`);
    console.log(`📧 Subject: ${safeString(data.subject)}`);
    
    // Check KMRL relevance
    if (!isKMRLRelated(data)) {
        console.log(`⏭️ Skipping email ${i + 1}`);
        continue;
    }
    
    console.log(`✅ Processing email ${i + 1}`);
    
    // SIMPLE RESULT CREATION - Just create a basic result for testing
    results.push({
        json: {
            test: true,
            emailIndex: i + 1,
            subject: safeString(data.subject),
            from: safeString(data.from),
            messageId: data.id || `test_${i}`,
            hasAttachments: Object.keys(binary).length > 0,
            attachmentCount: Object.keys(binary).length,
            timestamp: new Date().toISOString()
        }
    });
    
    console.log(`📊 Added result for email ${i + 1}`);
}

console.log(`\n🎯 FINAL DEBUG SUMMARY:`);
console.log(`📧 Input items: ${items.length}`);
console.log(`📄 Output results: ${results.length}`);
console.log(`📋 Results array:`, JSON.stringify(results, null, 2));

// ENSURE RETURN
if (results.length === 0) {
    console.log(`⚠️ No results generated - returning test result`);
    return [{
        json: {
            debug: true,
            message: "No emails processed",
            inputCount: items.length,
            timestamp: new Date().toISOString()
        }
    }];
}

console.log(`✅ Returning ${results.length} results`);
return results;