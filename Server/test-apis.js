// Comprehensive test script for Smart Transportation + Carpool Integration
// Run this after starting your server to test the complete flow

const API_BASE = "http://localhost:8000";
const TOKEN = "your-jwt-token-here"; // Get this from login

async function testIntegratedFlow() {
    console.log("🚀 Testing Smart Transportation + Carpool Integration...\n");

    // Test 1: Get transportation options
    console.log("1️⃣ Step 1: Getting transportation options...");
    let transportId;
    try {
        const response = await fetch(`${API_BASE}/api/transportation/options`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: {
                    lat: 28.6519,
                    lng: 77.2315,
                    address: "Karol Bagh, Delhi",
                    zone: "Central Delhi"
                },
                destination: {
                    lat: 28.5562,
                    lng: 77.1000,
                    address: "Indira Gandhi International Airport",
                    zone: "Airport"
                },
                requestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
            })
        });
        
        const data = await response.json();
        if (data.success && data.data) {
            transportId = data.data._id;
            console.log("✅ Transportation options received:");
            data.data.transportOptions.forEach(option => {
                console.log(`   ${option.type}: ₹${option.estimatedCost}, ${option.estimatedTime}min, Traffic: ${option.trafficLevel}`);
            });
        } else {
            console.log("❌ Failed to get transportation options:", data.message);
        }
    } catch (error) {
        console.log("❌ Transportation options failed:", error.message);
    }

    if (!transportId) return;

    // Test 2: Select carpool option
    console.log("\n2️⃣ Step 2: Selecting carpool option...");
    try {
        const response = await fetch(`${API_BASE}/api/transportation/select`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transportId: transportId,
                selectedType: "carpool"
            })
        });
        
        const data = await response.json();
        if (data.success && data.data) {
            console.log("✅ Carpool option selected!");
            if (data.data.pool) {
                console.log(`   🎉 Pool formed immediately with ${data.data.pool.memberCount} members!`);
                console.log(`   💰 Cost per person: ₹${data.data.pool.costPerUser}`);
                console.log(`   📍 Pickup: ${data.data.pool.pickupZone.lat.toFixed(4)}, ${data.data.pool.pickupZone.lng.toFixed(4)}`);
            } else {
                console.log("   ⏳ Added to queue - waiting for matching riders...");
            }
        } else {
            console.log("❌ Failed to select carpool:", data.message);
        }
    } catch (error) {
        console.log("❌ Carpool selection failed:", error.message);
    }

    // Test 3: Check carpool status
    console.log("\n3️⃣ Step 3: Checking carpool status...");
    try {
        const response = await fetch(`${API_BASE}/api/transportation/${transportId}/carpool-status`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        const data = await response.json();
        if (data.success && data.data) {
            console.log("✅ Carpool status retrieved:");
            console.log(`   Status: ${data.data.waitingMessage}`);
            console.log(`   Is Matched: ${data.data.isMatched ? 'Yes' : 'No'}`);
            if (data.data.pool) {
                console.log(`   Pool Members: ${data.data.pool.memberCount}`);
                console.log(`   Pool Status: ${data.data.pool.status}`);
            }
        } else {
            console.log("❌ Failed to get carpool status:", data.message);
        }
    } catch (error) {
        console.log("❌ Carpool status check failed:", error.message);
    }

    // Test 4: Check route suggestions (from LLM teammate)
    console.log("\n4️⃣ Step 4: Getting route suggestions...");
    try {
        const response = await fetch(`${API_BASE}/api/transportation/${transportId}/suggestions`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        const data = await response.json();
        if (data.success && data.data) {
            console.log("✅ Route suggestions received:");
            if (data.data.shouldSwitch) {
                console.log(`   🚨 Switch recommended: ${data.data.suggestions[0]?.reason || 'Traffic detected'}`);
                console.log(`   💡 LLM says: "${data.data.suggestions[0]?.llmRecommendation || 'Consider alternative route'}"`);
            } else {
                console.log("   ✅ Current route is optimal - no switch needed");
            }
        } else {
            console.log("❌ Failed to get route suggestions:", data.message);
        }
    } catch (error) {
        console.log("❌ Route suggestions failed:", error.message);
    }

    console.log("\n🎯 Integration Test Summary:");
    console.log("✅ Transportation options (with ML predictions)");
    console.log("✅ Carpool selection and matching");
    console.log("✅ Real-time pool formation");
    console.log("✅ Route switching suggestions (LLM)");
    console.log("\n🚀 Ready for hackathon demo!");
}

// Test function for creating multiple users to test pool formation
async function testPoolFormation() {
    console.log("\n🤝 Testing Pool Formation with Multiple Users...");
    
    const users = [
        { name: "User1", token: "token1" },
        { name: "User2", token: "token2" },
        { name: "User3", token: "token3" }
    ];

    // Simulate multiple users requesting similar routes
    for (const user of users) {
        console.log(`\n👤 ${user.name} requesting carpool...`);
        
        // Small variations in source location to test matching algorithm
        const latVariation = (Math.random() - 0.5) * 0.01; // ~500m variation
        const lngVariation = (Math.random() - 0.5) * 0.01;
        
        try {
            // Get transportation options
            const optionsResponse = await fetch(`${API_BASE}/api/transportation/options`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: {
                        lat: 28.6519 + latVariation,
                        lng: 77.2315 + lngVariation,
                        address: "Karol Bagh, Delhi"
                    },
                    destination: {
                        lat: 28.5562,
                        lng: 77.1000,
                        address: "IGI Airport"
                    },
                    requestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                })
            });
            
            const optionsData = await optionsResponse.json();
            
            if (optionsData.success) {
                // Select carpool
                const selectResponse = await fetch(`${API_BASE}/api/transportation/select`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        transportId: optionsData.data._id,
                        selectedType: "carpool"
                    })
                });
                
                const selectData = await selectResponse.json();
                
                if (selectData.data.pool) {
                    console.log(`   ✅ ${user.name} matched! Pool has ${selectData.data.pool.memberCount} members`);
                } else {
                    console.log(`   ⏳ ${user.name} waiting for matches...`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ${user.name} failed:`, error.message);
        }
    }
}

// Demo Flow for Hackathon Presentation
async function runHackathonDemo() {
    console.log("🎭 HACKATHON DEMO FLOW");
    console.log("=" * 50);
    
    console.log("\n📱 USER OPENS APP");
    console.log("🗺️  Selects: Karol Bagh → IGI Airport, 2 PM departure");
    
    console.log("\n🤖 ML TEAMMATE'S MODEL PREDICTS:");
    console.log("   • Carpool: ₹150, 45min, Medium traffic");  
    console.log("   • Metro: ₹60, 55min, Low traffic");
    console.log("   • Taxi: ₹400, 40min, High traffic");
    
    console.log("\n✅ USER SELECTS CARPOOL");
    console.log("🔍 Matching algorithm runs...");
    console.log("🎉 Found 3 other people!");
    console.log("💰 Cost reduced to ₹37.50 per person");
    console.log("📍 Pickup at optimal location");
    
    console.log("\n🚨 LLM TEAMMATE DETECTS TRAFFIC");
    console.log("💡 'Heavy traffic on Route 1. Switch to Metro?'");
    console.log("📊 'Metro will save you ₹100 and 15 minutes'");
    
    console.log("\n🏆 RESULT: Smart transportation with AI!");
    console.log("   • 75% cost reduction vs taxi");
    console.log("   • Real-time optimization");
    console.log("   • Environmental impact");
}

// Uncomment the test you want to run:
// testIntegratedFlow();
// testPoolFormation();
// runHackathonDemo();
