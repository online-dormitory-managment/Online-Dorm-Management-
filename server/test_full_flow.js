async function testFullFlow() {
    try {
        console.log('--- Step 1: Login ---');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'PROCTOR_4K_A_M',
                password: 'password123'
            })
        });
        
        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('Login Failed:', loginData.message);
            return;
        }

        const token = loginData.token;
        console.log('Login Success! Token obtained.');

        console.log('\n--- Step 2: Fetch Notifications ---');
        try {
            const notifRes = await fetch('http://localhost:5000/api/notifications/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const notifData = await notifRes.json();
            if (notifRes.ok) {
                console.log('Notifications Fetch Success:', notifData.length, 'records');
            } else {
                console.error('Notifications Fetch Failed:', notifRes.status, notifData);
            }
        } catch (e) {
            console.error('Notifications Fetch Error:', e.message);
        }

        console.log('\n--- Step 3: Fetch Dashboard ---');
        try {
            const dashRes = await fetch('http://localhost:5000/api/proctor/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dashData = await dashRes.json();
            if (dashRes.ok) {
                console.log('Dashboard Fetch Success:', dashData.success ? 'Yes' : 'No');
            } else {
                console.error('Dashboard Fetch Failed:', dashRes.status, dashData);
            }
        } catch (e) {
            console.error('Dashboard Fetch Error:', e.message);
        }

    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testFullFlow();
