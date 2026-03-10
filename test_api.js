// Test various office values to see API response
const testOffices = ['DEMO', 'Test123', 'Circle', 'PWD'];

const testAPI = async (office) => {
    try {
        console.log(`\n========== Testing office: ${office} ==========`);
        const response = await fetch('https://sghitech.up.railway.app/api/budget/allImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ office }),
        });

        const result = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            console.log('✅ SUCCESS! Found', result.data.length, 'images');
            console.log('\nFirst image structure:');
            console.log(JSON.stringify(result.data[0], null, 2));

            console.log('\n=== All Image Keys ===');
            result.data.slice(0, 5).forEach((img, index) => {
                console.log(`Image ${index + 1}: ${Object.keys(img).join(', ')}`);

                const uri = img.imageUrl || img.ImageUrl || img.image || img.imageBase64 || (img.Image ? 'Has Image field' : null);
                if (uri) {
                    console.log(`   URI preview: ${typeof uri === 'string' ? uri.substring(0, 80) + '...' : 'Buffer/Object'}`);
                } else {
                    console.log('   ❌ NO VALID URI');
                }
            });
        } else {
            console.log('❌ Failed:', result.message || result.error || 'No data');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// Test all offices
(async () => {
    for (const office of testOffices) {
        await testAPI(office);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }
})();
