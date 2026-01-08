
try {
    require('../controllers/team.controller');
    console.log('✅ Syntax Check Passed: team.controller.ts loaded successfully.');
} catch (error) {
    console.error('❌ Syntax Check Failed:', error);
    process.exit(1);
}
